"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  FileClock,
  LoaderCircle,
  LogOut,
  MapPin,
  NotebookPen,
  Package,
  Pill,
  Search,
  X,
  Truck,
  Users,
  Video,
  Building2,
} from "lucide-react";
import { symptomSuggestions } from "@/components/homepage/content";
import { CanadianTime } from "@/components/canadian-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  cancelPatientAppointment,
  createPatientDocumentRequest,
  createPatientFamilyMember,
  createPatientPoolAppointment,
  downloadPatientRequestAttachment,
  createPatientRescheduleRequest,
  deletePatientFamilyMember,
  fetchPatientAppointments,
  fetchPatientFamilyMembers,
  fetchPatientProfile,
  fetchPatientRescheduleOptions,
  fetchPatientRequests,
  fetchPatientServices,
  updatePatientProfile,
} from "@/lib/api/patient";
import { fetchBimblePharmacies, fetchPatientIntakeSlots } from "@/lib/api/patient-intake";
import type { PatientBimblePharmacy } from "@/lib/api/patient-intake";
import { clearPatientLoginSession, readPatientLoginSession } from "@/lib/patient/session";
import type {
  PatientFamilyMember,
  PatientFulfillment,
  PatientLoginSession,
  PatientPortalAppointment,
  PatientPharmacyChoice,
  PatientPortalAppointmentsPayload,
  PatientPortalRequest,
  PatientRescheduleSlotOption,
  PatientPortalService,
  PatientProfile,
  PatientVisitType,
} from "@/lib/patient/types";
import {
  formatCanadaPacificDateKey,
  getCanadaPacificDateKey,
  shiftCanadaPacificDateKey,
} from "@/lib/time-zone";
import {
  getLiveAlphabeticError,
  getLiveFutureDateError,
  getLiveEmailError,
  getLivePostalCodeError,
  getLiveProvinceCodeError,
  getLiveTenDigitError,
  limitDigits,
  normalizeNameInput,
  normalizeCityInput,
  normalizePostalCode,
  normalizeProvinceCodeInput,
  stripCountrySuffix,
} from "@/lib/form-validation";
import { useRealtimeRefresh } from "@/lib/realtime";

type ProfileDraft = {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string;
  phn: string;
  email: string;
  address_line_1: string;
  city: string;
  province: string;
  postal_code: string;
};

type ProfileFormErrors = Partial<
  Record<
    | "first_name"
    | "last_name"
    | "phone"
    | "date_of_birth"
    | "phn"
    | "email"
    | "city"
    | "province"
    | "postal_code",
    string
  >
>;

type PortalNavItem = {
  id: "profile" | "appointments" | "history" | "requests" | "family";
  label: string;
  description: string;
  icon: React.ReactNode;
};

type BookingStep = "problem" | "visit_type" | "slot" | "fulfillment" | "pharmacy";

type BookingDraft = {
  problem_label: string;
  service_id: string;
  chief_complaint_details: string;
  visit_type: PatientVisitType | "";
  appointment_date: string;
  appointment_time: string;
  fulfillment: PatientFulfillment | "";
  pharmacy_choice: PatientPharmacyChoice | "";
  preferred_pharmacy_name: string;
  preferred_pharmacy_address: string;
  preferred_pharmacy_city: string;
  preferred_pharmacy_postal_code: string;
  preferred_pharmacy_phone: string;
};

type FamilyForm = {
  first_name: string;
  last_name: string;
  relationship_label: string;
  date_of_birth: string;
  email: string;
  phn: string;
  notes: string;
};

type FamilyFormErrors = Partial<Record<keyof Omit<FamilyForm, "email" | "notes">, string>>;

const emptyProfileDraft: ProfileDraft = {
  first_name: "",
  last_name: "",
  phone: "",
  date_of_birth: "",
  phn: "",
  email: "",
  address_line_1: "",
  city: "",
  province: "",
  postal_code: "",
};

const emptyFamilyForm: FamilyForm = {
  first_name: "",
  last_name: "",
  relationship_label: "",
  date_of_birth: "",
  email: "",
  phn: "",
  notes: "",
};

const emptyBookingDraft: BookingDraft = {
  problem_label: "",
  service_id: "",
  chief_complaint_details: "",
  visit_type: "",
  appointment_date: "",
  appointment_time: "",
  fulfillment: "",
  pharmacy_choice: "",
  preferred_pharmacy_name: "",
  preferred_pharmacy_address: "",
  preferred_pharmacy_city: "",
  preferred_pharmacy_postal_code: "",
  preferred_pharmacy_phone: "",
};

const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

function nextDates(count: number): string[] {
  const base = getCanadaPacificDateKey();
  return Array.from({ length: count }, (_, index) => shiftCanadaPacificDateKey(base, index));
}

function formatCalendarDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

function normalizeServiceName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function resolveServiceIdFromProblem(problemLabel: string, services: PatientPortalService[]) {
  const normalizedProblem = normalizeServiceName(problemLabel);
  const suggestion = symptomSuggestions.find(
    (item) => normalizeServiceName(item.label) === normalizedProblem,
  );
  const hints = suggestion?.serviceHints ?? [problemLabel];
  for (const hint of hints) {
    const normalizedHint = normalizeServiceName(hint);
    const match = services.find((service) =>
      normalizeServiceName(service.service_name).includes(normalizedHint),
    );
    if (match) return String(match.service_id);
  }
  return "";
}

function SectionCard({
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-border/70 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            {icon}
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p> : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function SmallPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3 text-slate-500">
        <span className="text-xs font-medium uppercase tracking-[0.16em]">{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}

function getBrowserCoordinates(): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 5000 },
    );
  });
}

export function PatientPortalDashboard() {
  const router = useRouter();
  const rescheduleDateInputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [session, setSession] = useState<PatientLoginSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] = useState<PortalNavItem["id"]>("profile");

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PatientPortalAppointmentsPayload | null>(null);
  const [requests, setRequests] = useState<PatientPortalRequest[]>([]);
  const [familyMembers, setFamilyMembers] = useState<PatientFamilyMember[]>([]);
  const [services, setServices] = useState<PatientPortalService[]>([]);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [profileFormErrors, setProfileFormErrors] = useState<ProfileFormErrors>({});
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [familyForm, setFamilyForm] = useState(emptyFamilyForm);
  const [familyFormErrors, setFamilyFormErrors] = useState<FamilyFormErrors>({});
  const [familyMessage, setFamilyMessage] = useState("");
  const [isSavingFamily, setIsSavingFamily] = useState(false);
  const [isFamilyFormOpen, setIsFamilyFormOpen] = useState(false);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>("problem");
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(emptyBookingDraft);
  const [bimblePharmacies, setBimblePharmacies] = useState<PatientBimblePharmacy[]>([]);
  const [pharmacySearch, setPharmacySearch] = useState("");
  const [isLoadingBimblePharmacies, setIsLoadingBimblePharmacies] = useState(false);
  const [bimblePharmacyError, setBimblePharmacyError] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>(TIME_SLOTS);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestActionKey, setRequestActionKey] = useState("");
  const [downloadingRequestId, setDownloadingRequestId] = useState<number | null>(null);
  const [expandedRescheduleAppointmentId, setExpandedRescheduleAppointmentId] = useState<number | null>(null);
  const [rescheduleOptionsByAppointment, setRescheduleOptionsByAppointment] = useState<
    Record<number, PatientRescheduleSlotOption[]>
  >({});
  const [selectedRescheduleDateByAppointment, setSelectedRescheduleDateByAppointment] = useState<
    Record<number, string>
  >({});
  const [selectedRescheduleSlotByAppointment, setSelectedRescheduleSlotByAppointment] = useState<
    Record<number, string>
  >({});
  const [appointmentMessage, setAppointmentMessage] = useState("");
  const [appointmentActionKey, setAppointmentActionKey] = useState("");
  const [rescheduleMessage, setRescheduleMessage] = useState("");
  const [rescheduleActionKey, setRescheduleActionKey] = useState("");

  const showProfileEmail = Boolean(profile?.email?.trim());
  const showProfilePhn = Boolean(profile?.phn?.trim());

  const navigation: PortalNavItem[] = [
    {
      id: "profile",
      label: "Profile",
      description: "Edit contact and address details",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "appointments",
      label: "Appointments",
      description: "View active and upcoming visits",
      icon: <CalendarDays className="h-4 w-4" />,
    },
    {
      id: "history",
      label: "History",
      description: "Review past visits",
      icon: <FileClock className="h-4 w-4" />,
    },
    {
      id: "requests",
      label: "Requests",
      description: "Track prescriptions and labs",
      icon: <NotebookPen className="h-4 w-4" />,
    },
    {
      id: "family",
      label: "Family",
      description: "Manage family profiles",
      icon: <Users className="h-4 w-4" />,
    },
  ];

  const selectedNearbyPharmacyId = useMemo(() => {
    const match = bimblePharmacies.find(
      (option) =>
        option.name === bookingDraft.preferred_pharmacy_name &&
        option.address === bookingDraft.preferred_pharmacy_address &&
        option.city === bookingDraft.preferred_pharmacy_city &&
        (option.postal_code || "") === bookingDraft.preferred_pharmacy_postal_code &&
        (option.phone || "") === bookingDraft.preferred_pharmacy_phone,
    );
    return match?.id ?? "";
  }, [bimblePharmacies, bookingDraft]);
  const selectedBimblePharmacy = useMemo(
    () => bimblePharmacies.find((option) => option.id === selectedNearbyPharmacyId) ?? null,
    [bimblePharmacies, selectedNearbyPharmacyId],
  );
  const filteredBimblePharmacies = useMemo(() => {
    const query = pharmacySearch.trim().toLowerCase();
    if (!query) return bimblePharmacies;
    return bimblePharmacies.filter((option) => option.name.toLowerCase().includes(query));
  }, [bimblePharmacies, pharmacySearch]);

  const requestableAppointments = useMemo(() => {
    const seen = new Set<number>();
    const nextAppointments: PatientPortalAppointment[] = [];
    for (const appointment of [...(appointments?.current ?? []), ...(appointments?.past ?? [])]) {
      if (!appointment.clinic_id || !appointment.clinic_name || appointment.status === "CANCELLED") {
        continue;
      }
      if (seen.has(appointment.appointment_id)) {
        continue;
      }
      seen.add(appointment.appointment_id);
      nextAppointments.push(appointment);
    }
    return nextAppointments;
  }, [appointments]);

  useEffect(() => {
    const storedSession = readPatientLoginSession();
    if (!storedSession) {
      router.replace("/patient-portal");
      return;
    }

    setSession(storedSession);
    setIsBootstrapping(false);
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const accessToken = session.accessToken;
    let cancelled = false;

    async function loadPortalData() {
      setLoadError("");
      try {
        const [nextProfile, nextAppointments, nextRequests, nextFamilyMembers, nextServices] =
          await Promise.all([
            fetchPatientProfile(accessToken),
            fetchPatientAppointments(accessToken),
            fetchPatientRequests(accessToken),
            fetchPatientFamilyMembers(accessToken),
            fetchPatientServices(),
          ]);

        if (cancelled) return;

        setProfile(nextProfile);
        setAppointments(nextAppointments);
        setRequests(nextRequests);
        setFamilyMembers(nextFamilyMembers);
        setServices(nextServices);
      setProfileDraft({
        first_name: normalizeNameInput(nextProfile.first_name ?? ""),
        last_name: normalizeNameInput(nextProfile.last_name ?? ""),
        phone: limitDigits(nextProfile.phone ?? "", 10),
        date_of_birth: nextProfile.date_of_birth ?? "",
        phn: limitDigits(nextProfile.phn ?? "", 10),
        email: nextProfile.email ?? "",
        address_line_1: stripCountrySuffix(nextProfile.address_line_1 ?? ""),
        city: normalizeCityInput(nextProfile.city ?? ""),
        province: normalizeProvinceCodeInput(nextProfile.province ?? ""),
        postal_code: normalizePostalCode(nextProfile.postal_code ?? ""),
      });
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof Error ? error.message : "Could not load the patient portal right now.",
        );
      }
    }

    void loadPortalData();

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!bookingOpen || bookingStep !== "slot" || !bookingDraft.visit_type) return;
    const visitType = bookingDraft.visit_type;
    let cancelled = false;

    async function loadSlots() {
      try {
        const response = await fetchPatientIntakeSlots(visitType);
        if (cancelled) return;
        setAvailableDates(response.dates?.length ? response.dates : nextDates(14));
        setAvailableTimes(response.time_slots?.length ? response.time_slots : TIME_SLOTS);
      } catch {
        if (cancelled) return;
        setAvailableDates(nextDates(14));
        setAvailableTimes(TIME_SLOTS);
      }
    }

    void loadSlots();
    return () => {
      cancelled = true;
    };
  }, [bookingDraft.visit_type, bookingOpen, bookingStep]);

  useEffect(() => {
    let cancelled = false;

    async function loadBimbleList() {
      if (!bookingOpen || bookingStep !== "pharmacy" || bookingDraft.pharmacy_choice !== "preferred") return;
      setBimblePharmacyError("");
      setIsLoadingBimblePharmacies(true);

      try {
        const coords = await getBrowserCoordinates();
        if (cancelled) return;
        const response = await fetchBimblePharmacies(coords?.lat, coords?.lng);
        if (cancelled) return;
        const pharmacies = response.pharmacies ?? [];
        setBimblePharmacies(pharmacies);
        if (!pharmacies.length) {
          setBimblePharmacyError("No active pharmacies are available right now.");
        }
      } catch (error) {
        if (cancelled) return;
        setBimblePharmacies([]);
        setBimblePharmacyError(
          error instanceof Error ? error.message : "Could not load Bimble pharmacies right now.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingBimblePharmacies(false);
        }
      }
    }

    void loadBimbleList();
    return () => {
      cancelled = true;
    };
  }, [bookingDraft.pharmacy_choice, bookingOpen, bookingStep]);

  async function refreshPortalData() {
    if (!session) return;
    const accessToken = session.accessToken;

    const [nextAppointments, nextRequests, nextFamilyMembers] = await Promise.all([
      fetchPatientAppointments(accessToken),
      fetchPatientRequests(accessToken),
      fetchPatientFamilyMembers(accessToken),
    ]);

    setAppointments(nextAppointments);
    setRequests(nextRequests);
    setFamilyMembers(nextFamilyMembers);
  }

  useRealtimeRefresh(refreshPortalData, {
    enabled: Boolean(session),
    paths: ["/patient-portal", "/appointments", "/requests", "/pool"],
  });

  function resetBookingFlow() {
    setBookingDraft(emptyBookingDraft);
    setBimblePharmacies([]);
    setBimblePharmacyError("");
    setPharmacySearch("");
    setBookingStep("problem");
    setBookingMessage("");
    setAvailableDates([]);
    setAvailableTimes(TIME_SLOTS);
  }

  function getAppointmentStatusLabel(status: string) {
    if (status === "QUEUED") return "Pending acceptance";
    if (status === "ASSIGNED") return "Accepted";
    if (status === "IN_PROGRESS") return "In progress";
    if (status === "COMPLETED") return "Completed";
    if (status === "CANCELLED") return "Cancelled";
    if (status === "NO_SHOW") return "No show";
    return status.replaceAll("_", " ").toLowerCase();
  }

  function getRescheduleStatusLabel(request: PatientPortalRequest | undefined) {
    if (!request) return "No reschedule requested";
    if (request.status === "SUBMITTED") return "Reschedule pending review";
    if (request.status === "IN_REVIEW") return "Reschedule under review";
    if (request.status === "FULFILLED") return "Reschedule accepted";
    if (request.status === "REJECTED") return "Reschedule declined";
    return request.status.replaceAll("_", " ").toLowerCase();
  }

  function applyNearbyPharmacy(optionId: string) {
    const option = bimblePharmacies.find((item) => item.id === optionId);
    if (!option) return;
    applyPharmacyOption(option);
  }

  function applyPharmacyOption(option: PatientBimblePharmacy) {
    setBookingDraft((current) => ({
      ...current,
      preferred_pharmacy_name: option.name,
      preferred_pharmacy_address: stripCountrySuffix(option.address),
      preferred_pharmacy_city: option.city,
      preferred_pharmacy_postal_code: option.postal_code || "",
      preferred_pharmacy_phone: option.phone || "",
    }));
  }

  function validateBookingStep(step: BookingStep) {
    if (step === "problem") {
      if (!bookingDraft.problem_label) return "Please choose the problem or reason for the visit.";
      return "";
    }
    if (step === "visit_type") {
      if (!bookingDraft.visit_type) return "Please choose virtual or walk-in.";
      return "";
    }
    if (step === "slot") {
      if (!bookingDraft.appointment_date || !bookingDraft.appointment_time) {
        return "Please choose the appointment date and time.";
      }
      return "";
    }
    if (step === "fulfillment") {
      if (!bookingDraft.fulfillment) return "Please choose pickup or delivery.";
      return "";
    }
    if (step === "pharmacy") {
      if (!bookingDraft.pharmacy_choice) {
        return "Please choose Bimble pharmacy or your preferred pharmacy.";
      }
      if (
        bookingDraft.pharmacy_choice === "preferred" &&
        (!bookingDraft.preferred_pharmacy_name ||
          !bookingDraft.preferred_pharmacy_address ||
          !bookingDraft.preferred_pharmacy_city ||
          !bookingDraft.preferred_pharmacy_postal_code ||
          !bookingDraft.preferred_pharmacy_phone)
      ) {
        return "Please complete the preferred pharmacy details.";
      }
      return "";
    }
    return "";
  }

  function goToNextBookingStep() {
    const error = validateBookingStep(bookingStep);
    if (error) {
      setBookingMessage(error);
      return;
    }
    setBookingMessage("");
    const order: BookingStep[] = ["problem", "visit_type", "slot", "fulfillment", "pharmacy"];
    const nextStep = order[order.indexOf(bookingStep) + 1];
    if (nextStep) setBookingStep(nextStep);
  }

  function goToPreviousBookingStep() {
    setBookingMessage("");
    const order: BookingStep[] = ["problem", "visit_type", "slot", "fulfillment", "pharmacy"];
    const previousStep = order[order.indexOf(bookingStep) - 1];
    if (previousStep) setBookingStep(previousStep);
  }

  async function handleSaveProfile() {
    if (!session) return;
    if (!validateProfileDraft()) {
      setProfileMessage("Please fix the highlighted fields.");
      return;
    }
    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const updated = await updatePatientProfile(session.accessToken, {
        ...profileDraft,
        first_name: profileDraft.first_name.trim(),
        last_name: profileDraft.last_name.trim(),
        phone: limitDigits(profileDraft.phone, 10),
        date_of_birth: profileDraft.date_of_birth,
        phn: limitDigits(profileDraft.phn, 10) || null,
        email: profileDraft.email.trim() || null,
        address_line_1: profileDraft.address_line_1.trim(),
        city: normalizeCityInput(profileDraft.city),
        province: normalizeProvinceCodeInput(profileDraft.province),
        postal_code: normalizePostalCode(profileDraft.postal_code),
        ...(showProfilePhn ? { phn: limitDigits(profileDraft.phn, 10) } : {}),
        ...(showProfileEmail ? { email: profileDraft.email.trim() } : {}),
      });
      setProfile(updated);
      setProfileDraft({
        first_name: normalizeNameInput(updated.first_name ?? ""),
        last_name: normalizeNameInput(updated.last_name ?? ""),
        phone: limitDigits(updated.phone ?? "", 10),
        date_of_birth: updated.date_of_birth ?? "",
        phn: limitDigits(updated.phn ?? "", 10),
        email: updated.email ?? "",
        address_line_1: updated.address_line_1 ?? "",
        city: normalizeCityInput(updated.city ?? ""),
        province: normalizeProvinceCodeInput(updated.province ?? ""),
        postal_code: normalizePostalCode(updated.postal_code ?? ""),
      });
      setProfileFormErrors({});
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not save the profile.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleCompleteBooking() {
    if (!session) return;
    const error = validateBookingStep("pharmacy");
    if (error) {
      setBookingMessage(error);
      return;
    }

    setIsBooking(true);
    setBookingMessage("");

    try {
      await createPatientPoolAppointment(session.accessToken, {
        service_id: bookingDraft.service_id ? Number(bookingDraft.service_id) : undefined,
        chief_complaint: [bookingDraft.problem_label, bookingDraft.chief_complaint_details.trim()]
          .filter(Boolean)
          .join(": "),
        visit_type: bookingDraft.visit_type || undefined,
        appointment_date: bookingDraft.appointment_date || undefined,
        appointment_time: bookingDraft.appointment_time || undefined,
        fulfillment: bookingDraft.fulfillment || undefined,
        pharmacy_choice: bookingDraft.pharmacy_choice || undefined,
        preferred_pharmacy_name: bookingDraft.preferred_pharmacy_name.trim() || undefined,
        preferred_pharmacy_address: bookingDraft.preferred_pharmacy_address.trim() || undefined,
        preferred_pharmacy_city: bookingDraft.preferred_pharmacy_city.trim() || undefined,
        preferred_pharmacy_postal_code:
          bookingDraft.preferred_pharmacy_postal_code.trim() || undefined,
        preferred_pharmacy_phone: bookingDraft.preferred_pharmacy_phone.trim() || undefined,
        care_location: profileDraft.city || undefined,
      });
      await refreshPortalData();
      resetBookingFlow();
      setBookingOpen(false);
      setBookingMessage("Appointment request added to the shared pool successfully.");
    } catch (error) {
      setBookingMessage(
        error instanceof Error ? error.message : "Could not complete the appointment booking.",
      );
    } finally {
      setIsBooking(false);
    }
  }

  async function handleAddFamilyMember() {
    if (!session) return;
    if (!validateFamilyForm()) {
      setFamilyMessage("Please fix the highlighted fields.");
      return;
    }
    setIsSavingFamily(true);
    setFamilyMessage("");

    try {
      await createPatientFamilyMember(session.accessToken, {
        first_name: familyForm.first_name.trim(),
        last_name: familyForm.last_name.trim(),
        relationship_label: familyForm.relationship_label.trim(),
        date_of_birth: familyForm.date_of_birth || undefined,
        email: familyForm.email || undefined,
        phn: familyForm.phn || undefined,
        notes: familyForm.notes || undefined,
      });
      setFamilyForm(emptyFamilyForm);
      setFamilyFormErrors({});
      setFamilyMessage("Family member added successfully.");
      setIsFamilyFormOpen(false);
      await refreshPortalData();
    } catch (error) {
      setFamilyMessage(error instanceof Error ? error.message : "Could not add the family member.");
    } finally {
      setIsSavingFamily(false);
    }
  }

  async function handleDeleteFamilyMember(familyMemberId: number) {
    if (!session) return;
    setFamilyMessage("");

    try {
      await deletePatientFamilyMember(session.accessToken, familyMemberId);
      setFamilyMessage("Family member removed.");
      await refreshPortalData();
    } catch (error) {
      setFamilyMessage(
        error instanceof Error ? error.message : "Could not remove the family member.",
      );
    }
  }

  async function handleCreateDocumentRequest(
    appointment: PatientPortalAppointment,
    requestType: "PRESCRIPTION" | "LAB_REPORT",
  ) {
    if (!session) return;
    if (!appointment.clinic_id) {
      setRequestMessage("This appointment is not linked to a clinic yet.");
      return;
    }

    const actionKey = `${appointment.appointment_id}:${requestType}`;
    setRequestActionKey(actionKey);
    setRequestMessage("");

    try {
      await createPatientDocumentRequest(session.accessToken, appointment.appointment_id, {
        request_type: requestType,
        clinic_id: appointment.clinic_id,
        details: [
          appointment.chief_complaint,
          appointment.appointment_date ? `Visit date: ${appointment.appointment_date}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
      await refreshPortalData();
      setRequestMessage(
        `${requestType === "PRESCRIPTION" ? "Prescription" : "Lab report"} request sent to ${
          appointment.clinic_name ?? "the clinic"
        }.`,
      );
      setActiveSection("requests");
    } catch (error) {
      setRequestMessage(
        error instanceof Error ? error.message : "Could not send the clinic request.",
      );
    } finally {
      setRequestActionKey((current) => (current === actionKey ? "" : current));
    }
  }

  async function handleDownloadRequestAttachment(request: PatientPortalRequest) {
    if (!session) return;
    setRequestMessage("");
    setDownloadingRequestId(request.request_id);
    try {
      const file = await downloadPatientRequestAttachment(session.accessToken, request.request_id);
      const objectUrl = window.URL.createObjectURL(file.blob);
      const link = window.document.createElement("a");
      link.href = objectUrl;
      link.download = file.filename || request.attachment_name || `request-${request.request_id}-document`;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setRequestMessage(
        error instanceof Error ? error.message : "Could not download the clinic document right now.",
      );
    } finally {
      setDownloadingRequestId(null);
    }
  }

  function getLatestRescheduleRequest(appointmentId: number) {
    return requests.find(
      (request) => request.appointment_id === appointmentId && request.request_type === "RESCHEDULE",
    );
  }

  async function handleOpenReschedule(appointment: PatientPortalAppointment) {
    if (!session) return;
    setRescheduleMessage("");
    setExpandedRescheduleAppointmentId(appointment.appointment_id);

    if (rescheduleOptionsByAppointment[appointment.appointment_id]) {
      return;
    }

    const actionKey = `load:${appointment.appointment_id}`;
    setRescheduleActionKey(actionKey);
    try {
      const response = await fetchPatientRescheduleOptions(session.accessToken, appointment.appointment_id);
      setRescheduleOptionsByAppointment((current) => ({
        ...current,
        [appointment.appointment_id]: response.slots ?? [],
      }));
      if (response.slots?.[0]) {
        const firstSlot = response.slots[0];
        setSelectedRescheduleDateByAppointment((current) => ({
          ...current,
          [appointment.appointment_id]: firstSlot.appointment_date,
        }));
        setSelectedRescheduleSlotByAppointment((current) => ({
          ...current,
          [appointment.appointment_id]: `${firstSlot.appointment_date}|${firstSlot.appointment_time}|${firstSlot.doctor_id}`,
        }));
      }
      if (!response.slots?.length) {
        setRescheduleMessage("No doctor-approved reschedule slots are available right now.");
      }
    } catch (error) {
      setRescheduleMessage(
        error instanceof Error ? error.message : "Could not load reschedule options.",
      );
    } finally {
      setRescheduleActionKey((current) => (current === actionKey ? "" : current));
    }
  }

  async function handleSubmitReschedule(appointment: PatientPortalAppointment) {
    if (!session) return;
    const selectedSlot = selectedRescheduleSlotByAppointment[appointment.appointment_id];
    if (!selectedSlot) {
      setRescheduleMessage("Please choose one of the available slots.");
      return;
    }
    const [requestedDate, requestedTime, requestedDoctorIdRaw] = selectedSlot.split("|");
    if (!requestedDate || !requestedTime) {
      setRescheduleMessage("Please choose one of the available slots.");
      return;
    }

    const actionKey = `submit:${appointment.appointment_id}`;
    setRescheduleActionKey(actionKey);
    setRescheduleMessage("");
    try {
      await createPatientRescheduleRequest(session.accessToken, appointment.appointment_id, {
        clinic_id: appointment.clinic_id ?? undefined,
        requested_appointment_date: requestedDate,
        requested_appointment_time: requestedTime,
        requested_doctor_id: requestedDoctorIdRaw ? Number(requestedDoctorIdRaw) : undefined,
        details: [
          appointment.chief_complaint || appointment.service_name || "Appointment",
          "Patient requested a new date and time from the approved availability list.",
        ].join(" · "),
      });
      await refreshPortalData();
      setRescheduleMessage("Reschedule request sent to the clinic.");
      setExpandedRescheduleAppointmentId(null);
    } catch (error) {
      setRescheduleMessage(
        error instanceof Error ? error.message : "Could not send the reschedule request.",
      );
    } finally {
      setRescheduleActionKey((current) => (current === actionKey ? "" : current));
    }
  }

  async function handleCancelAppointment(appointment: PatientPortalAppointment) {
    if (!session) return;
    const confirmed = window.confirm(
      "Do you want to cancel this appointment? You can book another appointment later.",
    );
    if (!confirmed) return;

    const actionKey = `cancel:${appointment.appointment_id}`;
    setAppointmentActionKey(actionKey);
    setAppointmentMessage("");
    setRescheduleMessage("");
    try {
      await cancelPatientAppointment(session.accessToken, appointment.appointment_id, {
        reason: "Cancelled by patient",
      });
      await refreshPortalData();
      if (expandedRescheduleAppointmentId === appointment.appointment_id) {
        setExpandedRescheduleAppointmentId(null);
      }
      setAppointmentMessage("Appointment cancelled successfully.");
    } catch (error) {
      setAppointmentMessage(
        error instanceof Error ? error.message : "Could not cancel the appointment.",
      );
    } finally {
      setAppointmentActionKey((current) => (current === actionKey ? "" : current));
    }
  }

  function handleRescheduleDateChange(appointmentId: number, nextDate: string) {
    setSelectedRescheduleDateByAppointment((current) => ({
      ...current,
      [appointmentId]: nextDate,
    }));
    const nextSlot = (rescheduleOptionsByAppointment[appointmentId] ?? []).find(
      (slot) => slot.appointment_date === nextDate,
    );
    setSelectedRescheduleSlotByAppointment((current) => ({
      ...current,
      [appointmentId]: nextSlot
        ? `${nextSlot.appointment_date}|${nextSlot.appointment_time}|${nextSlot.doctor_id}`
        : "",
    }));
  }

  function handleSignOut() {
    clearPatientLoginSession();
    router.replace("/patient-portal?mode=login");
  }

  function updateProfileField(field: keyof ProfileDraft, rawValue: string) {
    const nextValue =
      field === "first_name" || field === "last_name"
        ? normalizeNameInput(rawValue)
        : field === "date_of_birth"
          ? rawValue
          : field === "phn"
            ? limitDigits(rawValue, 10)
            : field === "address_line_1"
              ? stripCountrySuffix(rawValue)
        : field === "city"
          ? normalizeCityInput(rawValue)
          : field === "phone"
            ? limitDigits(rawValue, 10)
            : field === "province"
              ? normalizeProvinceCodeInput(rawValue)
              : field === "postal_code"
                ? normalizePostalCode(rawValue)
                : rawValue;

    setProfileDraft((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setProfileFormErrors((current) => {
      const nextErrors: ProfileFormErrors = { ...current };

      if (field === "first_name" || field === "last_name") {
        nextErrors[field] = getLiveAlphabeticError(nextValue, field.replaceAll("_", " "));
      } else if (field === "phone") {
        nextErrors.phone = getLiveTenDigitError(nextValue, "phone number");
      } else if (field === "date_of_birth") {
        nextErrors.date_of_birth = getLiveFutureDateError(nextValue, "Date of birth");
      } else if (field === "phn") {
        nextErrors.phn = getLiveTenDigitError(nextValue, "PHN");
      } else if (field === "email") {
        nextErrors.email = getLiveEmailError(nextValue, "email address");
      } else if (field === "city") {
        nextErrors.city = getLiveAlphabeticError(nextValue, "city");
      } else if (field === "province") {
        nextErrors.province = getLiveProvinceCodeError(nextValue, "province");
      } else if (field === "postal_code") {
        nextErrors.postal_code = getLivePostalCodeError(nextValue, "postal code");
      }

      return nextErrors;
    });
  }

  function validateProfileDraft() {
    const nextErrors: ProfileFormErrors = {};

    if (!profileDraft.first_name.trim()) {
      nextErrors.first_name = "First name is required.";
    } else {
      nextErrors.first_name = getLiveAlphabeticError(profileDraft.first_name, "first name");
    }

    if (!profileDraft.last_name.trim()) {
      nextErrors.last_name = "Last name is required.";
    } else {
      nextErrors.last_name = getLiveAlphabeticError(profileDraft.last_name, "last name");
    }

    if (!profileDraft.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else {
      nextErrors.phone = getLiveTenDigitError(profileDraft.phone, "phone number");
    }

    if (!profileDraft.date_of_birth.trim()) {
      nextErrors.date_of_birth = "Date of birth is required.";
    } else {
      nextErrors.date_of_birth = getLiveFutureDateError(
        profileDraft.date_of_birth,
        "Date of birth",
      );
    }

    if (profileDraft.phn.trim()) {
      nextErrors.phn = getLiveTenDigitError(profileDraft.phn, "PHN");
    }

    if (profileDraft.email.trim()) {
      nextErrors.email = getLiveEmailError(profileDraft.email, "email address");
    }

    if (!profileDraft.phn.trim() && !profileDraft.email.trim()) {
      nextErrors.phn = "Enter a PHN or email.";
      nextErrors.email = "Enter a PHN or email.";
    }

    if (!profileDraft.city.trim()) {
      nextErrors.city = "City is required.";
    } else {
      nextErrors.city = getLiveAlphabeticError(profileDraft.city, "city");
    }

    if (!profileDraft.province.trim()) {
      nextErrors.province = "Province is required.";
    } else {
      nextErrors.province = getLiveProvinceCodeError(profileDraft.province, "province");
    }

    if (!profileDraft.postal_code.trim()) {
      nextErrors.postal_code = "Postal code is required.";
    } else {
      nextErrors.postal_code = getLivePostalCodeError(profileDraft.postal_code, "postal code");
    }

    setProfileFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateFamilyField(field: keyof FamilyForm, rawValue: string) {
    const nextValue =
      field === "first_name" || field === "last_name" || field === "relationship_label"
        ? normalizeNameInput(rawValue)
        : field === "phn"
          ? limitDigits(rawValue, 10)
          : rawValue;

    setFamilyForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    setFamilyFormErrors((current) => {
      const nextErrors: FamilyFormErrors = { ...current };

      if (field === "first_name" || field === "last_name" || field === "relationship_label") {
        nextErrors[field] = getLiveAlphabeticError(nextValue, field.replaceAll("_", " "));
      } else if (field === "date_of_birth") {
        nextErrors.date_of_birth = getLiveFutureDateError(nextValue, "Date of birth");
      } else if (field === "phn") {
        nextErrors.phn = getLiveTenDigitError(nextValue, "PHN");
      }

      return nextErrors;
    });
  }

  function validateFamilyForm() {
    const nextErrors: FamilyFormErrors = {};

    if (!familyForm.first_name.trim()) {
      nextErrors.first_name = "First name is required.";
    } else {
      nextErrors.first_name = getLiveAlphabeticError(familyForm.first_name, "first name");
    }

    if (!familyForm.last_name.trim()) {
      nextErrors.last_name = "Last name is required.";
    } else {
      nextErrors.last_name = getLiveAlphabeticError(familyForm.last_name, "last name");
    }

    if (!familyForm.relationship_label.trim()) {
      nextErrors.relationship_label = "Relationship is required.";
    } else {
      nextErrors.relationship_label = getLiveAlphabeticError(
        familyForm.relationship_label,
        "relationship",
      );
    }

    if (!familyForm.date_of_birth.trim()) {
      nextErrors.date_of_birth = "Date of birth is required.";
    } else {
      nextErrors.date_of_birth = getLiveFutureDateError(familyForm.date_of_birth, "Date of birth");
    }

    if (!familyForm.phn.trim()) {
      nextErrors.phn = "PHN is required.";
    } else {
      nextErrors.phn = getLiveTenDigitError(familyForm.phn, "PHN");
    }

    setFamilyFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  if (isBootstrapping || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        Loading your patient workspace...
      </div>
    );
  }

  const activeAppointments = appointments?.current ?? [];
  const pastAppointments = appointments?.past ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)] xl:gap-8">
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-[24px] border border-sky-200/70 bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-950">
              {profile?.first_name || "Patient"} {profile?.last_name || "Portal"}
            </h1>
            {showProfilePhn ? <p className="mt-1 text-xs text-slate-500">PHN: {profile?.phn}</p> : null}
          </div>

          <nav className="mt-4 space-y-2">
            {navigation.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                    isActive ? "bg-sky-50 ring-1 ring-sky-200" : "hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      isActive ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                    <div className="truncate text-xs text-slate-500">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          <Button variant="outline" className="mt-4 h-10 w-full rounded-2xl" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="space-y-6">
        {loadError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        {activeSection === "profile" ? (
          <SectionCard
            title="Profile details"
            subtitle="Keep your contact information up to date."
            icon={<Users className="h-5 w-5" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-700">
                First name
                <Input
                  value={profileDraft.first_name}
                  onChange={(event) => updateProfileField("first_name", event.target.value)}
                  autoCapitalize="words"
                />
                {profileFormErrors.first_name ? (
                  <div className="text-xs text-rose-600">{profileFormErrors.first_name}</div>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Last name
                <Input
                  value={profileDraft.last_name}
                  onChange={(event) => updateProfileField("last_name", event.target.value)}
                  autoCapitalize="words"
                />
                {profileFormErrors.last_name ? (
                  <div className="text-xs text-rose-600">{profileFormErrors.last_name}</div>
                ) : null}
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Phone
                <Input
                  value={profileDraft.phone}
                  onChange={(event) => updateProfileField("phone", event.target.value)}
                  inputMode="numeric"
                  maxLength={10}
                />
                {profileFormErrors.phone ? (
                  <div className="text-xs text-rose-600">{profileFormErrors.phone}</div>
                ) : null}
              </label>
              {showProfileEmail ? (
                <label className="grid gap-2 text-sm text-slate-700">
                  Email
                  <Input
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) => updateProfileField("email", event.target.value)}
                  />
                  {profileFormErrors.email ? (
                    <div className="text-xs text-rose-600">{profileFormErrors.email}</div>
                  ) : null}
                </label>
              ) : null}
              <label className="grid gap-2 text-sm text-slate-700">
                Date of birth
                <Input
                  type="date"
                  value={profileDraft.date_of_birth}
                  max={getCanadaPacificDateKey()}
                  onChange={(event) => updateProfileField("date_of_birth", event.target.value)}
                />
                {profileFormErrors.date_of_birth ? (
                  <div className="text-xs text-rose-600">{profileFormErrors.date_of_birth}</div>
                ) : null}
              </label>
              {showProfilePhn ? (
                <label className="grid gap-2 text-sm text-slate-700">
                  PHN
                  <Input
                    value={profileDraft.phn}
                    onChange={(event) => updateProfileField("phn", event.target.value)}
                    inputMode="numeric"
                    maxLength={10}
                  />
                  {profileFormErrors.phn ? (
                    <div className="text-xs text-rose-600">{profileFormErrors.phn}</div>
                  ) : null}
                </label>
              ) : null}
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-700">
                  Address
                  <Input
                    value={profileDraft.address_line_1}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        address_line_1: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  City
                  <Input
                    value={profileDraft.city}
                    onChange={(event) => updateProfileField("city", event.target.value)}
                    autoCapitalize="words"
                  />
                  {profileFormErrors.city ? (
                    <div className="text-xs text-rose-600">{profileFormErrors.city}</div>
                  ) : null}
                </label>
              </div>
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-700">
                  Province
                  <Input
                    value={profileDraft.province}
                    onChange={(event) => updateProfileField("province", event.target.value)}
                    maxLength={2}
                  />
                  {profileFormErrors.province ? (
                    <div className="text-xs text-rose-600">{profileFormErrors.province}</div>
                  ) : null}
                </label>
                <label className="grid gap-2 text-sm text-slate-700">
                  Postal code
                  <Input
                    value={profileDraft.postal_code}
                    onChange={(event) => updateProfileField("postal_code", event.target.value)}
                    autoCapitalize="characters"
                    maxLength={7}
                  />
                  {profileFormErrors.postal_code ? (
                    <div className="text-xs text-rose-600">{profileFormErrors.postal_code}</div>
                  ) : null}
                </label>
              </div>
            </div>

            {profileMessage ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {profileMessage}
              </div>
            ) : null}

            <div className="mt-4">
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save profile"}
              </Button>
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "appointments" ? (
          <SectionCard
            title="Appointments"
            icon={<CalendarDays className="h-5 w-5" />}
          >
            <div className="grid gap-3 md:max-w-sm">
              <SmallPill
                label="Active"
                value={activeAppointments.length}
                icon={<CalendarDays className="h-4 w-4" />}
              />
            </div>

            <div className="mt-4 space-y-3">
              {activeAppointments.length ? (
                activeAppointments.map((appointment) => {
                  const latestRescheduleRequest = getLatestRescheduleRequest(appointment.appointment_id);
                  const slotOptions = rescheduleOptionsByAppointment[appointment.appointment_id] ?? [];
                  const availableDates = Array.from(
                    new Set(slotOptions.map((slot) => slot.appointment_date)),
                  );
                  const todayDate = getCanadaPacificDateKey();
                  const selectableDates = availableDates.filter((date) => date >= todayDate);
                  const selectedDate =
                    selectedRescheduleDateByAppointment[appointment.appointment_id] ??
                    selectableDates[0] ??
                    "";
                  const slotsForSelectedDate = slotOptions.filter(
                    (slot) => slot.appointment_date === selectedDate,
                  );
                  const isExpanded = expandedRescheduleAppointmentId === appointment.appointment_id;
                  const selectedSlot = selectedRescheduleSlotByAppointment[appointment.appointment_id] ?? "";
                  const isLoadingOptions = rescheduleActionKey === `load:${appointment.appointment_id}`;
                  const isSubmittingReschedule = rescheduleActionKey === `submit:${appointment.appointment_id}`;
                  const isCancellingAppointment = appointmentActionKey === `cancel:${appointment.appointment_id}`;

                  return (
                    <div
                      key={appointment.appointment_id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {appointment.service_name || "General appointment"}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {appointment.clinic_name || "Clinic pending"} ·{" "}
                            <CanadianTime value={appointment.queued_at} fallback="Not available" />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
                            <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-700">
                              {getAppointmentStatusLabel(appointment.status)}
                            </span>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">
                              {getRescheduleStatusLabel(latestRescheduleRequest)}
                            </span>
                          </div>
                          {appointment.visit_type || appointment.appointment_date || appointment.appointment_time ? (
                            <div className="mt-2 text-sm text-slate-600">
                              {(appointment.visit_type || "").replace("_", "-") || "visit"} ·{" "}
                              {appointment.appointment_date || "Date pending"} ·{" "}
                              {appointment.appointment_time || "Time pending"}
                            </div>
                          ) : null}
                          {latestRescheduleRequest?.requested_appointment_date ||
                          latestRescheduleRequest?.requested_appointment_time ? (
                            <div className="mt-2 text-sm text-slate-600">
                              Requested reschedule: {latestRescheduleRequest.requested_appointment_date || "Date pending"}
                              {latestRescheduleRequest.requested_appointment_time
                                ? ` · ${latestRescheduleRequest.requested_appointment_time}`
                                : ""}
                            </div>
                          ) : null}
                          {latestRescheduleRequest?.clinic_response ? (
                            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                              Clinic update: {latestRescheduleRequest.clinic_response}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            disabled={
                              !appointment.clinic_id ||
                              appointment.status === "QUEUED" ||
                              isCancellingAppointment
                            }
                            onClick={() => void handleOpenReschedule(appointment)}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant="outline"
                            disabled={isCancellingAppointment}
                            onClick={() => void handleCancelAppointment(appointment)}
                          >
                            {isCancellingAppointment ? "Cancelling..." : "Cancel appointment"}
                          </Button>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Choose a new slot</div>
                          <div className="mt-1 text-sm text-slate-600">
                            Only slots available with the current doctor, or another doctor in the same clinic with the
                            same specialty, are shown here.
                          </div>

                          {isLoadingOptions ? (
                            <div className="mt-4 text-sm text-slate-600">Loading available slots...</div>
                          ) : slotOptions.length ? (
                            <div className="mt-4 space-y-4">
                              <label className="grid gap-2 text-sm text-slate-700">
                                Choose date
                                <div className="relative">
                                  <button
                                    type="button"
                                    className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm shadow-sm transition-colors hover:border-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
                                    onClick={() => {
                                      const input = rescheduleDateInputRefs.current[appointment.appointment_id];
                                      if (!input) return;
                                      if (typeof input.showPicker === "function") {
                                        input.showPicker();
                                      } else {
                                        input.click();
                                      }
                                    }}
                                  >
                                    <span className={selectedDate ? "text-slate-900" : "text-slate-400"}>
                                      {selectedDate ? formatCalendarDate(selectedDate) : "MM/DD/YYYY"}
                                    </span>
                                    <CalendarDays className="h-4 w-4 text-slate-400" />
                                  </button>
                                  <input
                                    ref={(node) => {
                                      rescheduleDateInputRefs.current[appointment.appointment_id] = node;
                                    }}
                                    type="date"
                                    value={selectedDate}
                                    min={todayDate}
                                    max={selectableDates[selectableDates.length - 1] || undefined}
                                    onChange={(event) =>
                                      handleRescheduleDateChange(
                                        appointment.appointment_id,
                                        event.target.value,
                                      )
                                    }
                                    lang="en-US"
                                    className="sr-only"
                                    tabIndex={-1}
                                    aria-hidden="true"
                                  />
                                </div>
                              </label>

                              <div className="space-y-2">
                                <div className="text-sm font-medium text-slate-800">Choose time</div>
                                {slotsForSelectedDate.length ? (
                                  <div className="grid max-h-[14rem] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                                    {slotsForSelectedDate.map((slot) => {
                                      const value = `${slot.appointment_date}|${slot.appointment_time}|${slot.doctor_id}`;
                                      return (
                                        <label
                                          key={value}
                                          className={cn(
                                            "flex h-full cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm transition-colors",
                                            selectedSlot === value
                                              ? "border-sky-300 bg-sky-50 text-sky-800"
                                              : "border-slate-200 bg-slate-50 text-slate-700",
                                          )}
                                        >
                                          <div className="min-w-0">
                                            <div className="font-semibold leading-tight">{slot.appointment_time}</div>
                                            <div className="mt-1 truncate text-xs text-slate-500">
                                              Provider: {slot.doctor_name}
                                            </div>
                                          </div>
                                          <input
                                            type="radio"
                                            name={`reschedule-slot-${appointment.appointment_id}`}
                                            checked={selectedSlot === value}
                                            onChange={() =>
                                              setSelectedRescheduleSlotByAppointment((current) => ({
                                                ...current,
                                                [appointment.appointment_id]: value,
                                              }))
                                            }
                                          />
                                        </label>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                                    No approved times are available for this date. Please choose another available date.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 text-sm text-slate-600">
                              No doctor-approved reschedule slots are available right now.
                            </div>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setExpandedRescheduleAppointmentId(null)}
                              disabled={isSubmittingReschedule}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => void handleSubmitReschedule(appointment)}
                              disabled={!slotOptions.length || isSubmittingReschedule}
                            >
                              {isSubmittingReschedule ? "Sending request..." : "Request reschedule"}
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No active appointments right now.
                </div>
              )}
            </div>

            {appointmentMessage ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {appointmentMessage}
              </div>
            ) : null}

            {rescheduleMessage ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                {rescheduleMessage}
              </div>
            ) : null}

            <div className="mt-5 flex justify-start">
              <Button
                onClick={() => {
                  setBookingOpen(true);
                  setBookingStep("problem");
                  setBookingMessage("");
                }}
              >
                Book appointment
              </Button>
            </div>

            {bookingOpen && (
              <div className="mt-5 space-y-5 rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "problem", label: "Problem" },
                    { id: "visit_type", label: "Visit type" },
                    { id: "slot", label: "Date & time" },
                    { id: "fulfillment", label: "Pickup / delivery" },
                    { id: "pharmacy", label: "Pharmacy" },
                  ].map((item, index) => {
                    const order: BookingStep[] = ["problem", "visit_type", "slot", "fulfillment", "pharmacy"];
                    const activeIndex = order.indexOf(bookingStep);
                    const itemIndex = order.indexOf(item.id as BookingStep);
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                          itemIndex <= activeIndex
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-slate-200 bg-white text-slate-400",
                        )}
                      >
                        {index + 1}. {item.label}
                      </div>
                    );
                  })}
                </div>

                {bookingStep === "problem" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm text-slate-700">
                      Problem or reason to visit
                      <select
                        className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                        value={bookingDraft.problem_label}
                        onChange={(event) => {
                          const nextProblem = event.target.value;
                          setBookingDraft((current) => ({
                            ...current,
                            problem_label: nextProblem,
                            service_id: resolveServiceIdFromProblem(nextProblem, services),
                          }));
                        }}
                      >
                        <option value="">Select a problem</option>
                        {symptomSuggestions.map((problem) => (
                          <option key={problem.label} value={problem.label}>
                            {problem.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-2 text-sm text-slate-700 sm:col-span-2">
                      Extra details for the visit
                      <Textarea
                        value={bookingDraft.chief_complaint_details}
                        onChange={(event) =>
                          setBookingDraft((current) => ({
                            ...current,
                            chief_complaint_details: event.target.value,
                          }))
                        }
                        placeholder="Optional details to help the clinic understand the visit."
                      />
                    </label>
                  </div>
                ) : null}

                {bookingStep === "visit_type" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        value: "virtual" as PatientVisitType,
                        title: "Virtual",
                        description: "Meet the doctor online from your phone or laptop.",
                        icon: <Video className="h-6 w-6" />,
                      },
                      {
                        value: "walk_in" as PatientVisitType,
                        title: "Walk-in",
                        description: "Visit the clinic in person at your chosen time.",
                        icon: <Building2 className="h-6 w-6" />,
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setBookingDraft((current) => ({ ...current, visit_type: option.value }))
                        }
                        className={cn(
                          "rounded-[24px] border p-5 text-left shadow-sm transition-all",
                          bookingDraft.visit_type === option.value
                            ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
                            : "border-slate-200 bg-white hover:border-sky-200",
                        )}
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                          {option.icon}
                        </div>
                        <div className="text-base font-semibold text-slate-900">{option.title}</div>
                        <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {bookingStep === "slot" ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Choose a date
                      </p>
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                        {(availableDates.length ? availableDates : nextDates(14)).map((value) => {
                          const selected = bookingDraft.appointment_date === value;
                          return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setBookingDraft((current) => ({
                                ...current,
                                appointment_date: value,
                                appointment_time: "",
                              }))
                            }
                              className={cn(
                                "min-w-[6rem] rounded-2xl border px-3 py-2 text-xs font-semibold transition-all",
                                selected
                                  ? "border-sky-300 bg-sky-50 text-sky-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-200",
                              )}
                            >
                              {formatCanadaPacificDateKey(value, {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Choose a time
                      </p>
                      {!bookingDraft.appointment_date ? (
                        <p className="mt-3 text-sm text-slate-500">
                          Please choose a date before selecting a time.
                        </p>
                      ) : null}
                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {availableTimes.map((value) => {
                          const selected = bookingDraft.appointment_time === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={!bookingDraft.appointment_date}
                              onClick={() =>
                                setBookingDraft((current) => ({ ...current, appointment_time: value }))
                              }
                              className={cn(
                                "rounded-2xl border px-3 py-2 text-sm font-medium transition-all",
                                !bookingDraft.appointment_date && "cursor-not-allowed opacity-50",
                                selected
                                  ? "border-sky-300 bg-sky-50 text-sky-700"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-200",
                              )}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {bookingStep === "fulfillment" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        value: "pickup" as PatientFulfillment,
                        title: "Pickup",
                        description: "Pick up the medication from the pharmacy chosen next.",
                        icon: <Package className="h-6 w-6" />,
                      },
                      {
                        value: "delivery" as PatientFulfillment,
                        title: "Delivery",
                        description: "Have the medication delivered once the prescription is ready.",
                        icon: <Truck className="h-6 w-6" />,
                      },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setBookingDraft((current) => ({
                            ...current,
                            fulfillment: option.value,
                            pharmacy_choice: "",
                          }))
                        }
                        className={cn(
                          "rounded-[24px] border p-5 text-left shadow-sm transition-all",
                          bookingDraft.fulfillment === option.value
                            ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
                            : "border-slate-200 bg-white hover:border-sky-200",
                        )}
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                          {option.icon}
                        </div>
                        <div className="text-base font-semibold text-slate-900">{option.title}</div>
                        <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                      </button>
                    ))}
                  </div>
                ) : null}

                {bookingStep === "pharmacy" ? (
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() =>
                          setBookingDraft((current) => ({
                            ...current,
                            pharmacy_choice: "bimble",
                          }))
                        }
                        className={cn(
                          "rounded-[24px] border p-5 text-left shadow-sm transition-all",
                          bookingDraft.pharmacy_choice === "bimble"
                            ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
                            : "border-slate-200 bg-white hover:border-sky-200",
                        )}
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                          <Pill className="h-6 w-6" />
                        </div>
                        <div className="text-base font-semibold text-slate-900">Bimble pharmacy</div>
                        <p className="mt-2 text-sm text-slate-600">
                          {bookingDraft.fulfillment === "delivery"
                            ? "Fastest option for delivery."
                            : "Fastest option for pickup."}
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBookingDraft((current) => ({
                            ...current,
                            pharmacy_choice: "preferred",
                            preferred_pharmacy_name: "",
                            preferred_pharmacy_address: "",
                            preferred_pharmacy_city: "",
                              preferred_pharmacy_postal_code: "",
                              preferred_pharmacy_phone: "",
                            }));
                            setPharmacySearch("");
                          }}
                        className={cn(
                          "rounded-[24px] border p-5 text-left shadow-sm transition-all",
                          bookingDraft.pharmacy_choice === "preferred"
                            ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
                            : "border-slate-200 bg-white hover:border-sky-200",
                        )}
                      >
                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                          <MapPin className="h-6 w-6" />
                        </div>
                        <div className="text-base font-semibold text-slate-900">Your preferred pharmacy</div>
                        <p className="mt-2 text-sm text-slate-600">
                          Use the patient&apos;s existing pharmacy for pickup or delivery.
                        </p>
                      </button>
                    </div>

                    {bookingDraft.pharmacy_choice === "preferred" ? (
                      <div className="space-y-4 rounded-[24px] border border-sky-100 bg-sky-50/50 p-5">
                        {isLoadingBimblePharmacies ? (
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                            Loading nearby pharmacies...
                          </div>
                        ) : null}
                        {bimblePharmacyError ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                            {bimblePharmacyError}
                          </div>
                        ) : null}
                          {bimblePharmacies.length ? (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">Choose a pharmacy</label>
                              <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                  value={pharmacySearch}
                                  onChange={(event) => setPharmacySearch(event.target.value)}
                                  placeholder="Search pharmacy by name"
                                  className="rounded-2xl bg-white pl-9"
                                />
                              </div>
                              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                {filteredBimblePharmacies.map((option) => {
                                  const selected = selectedNearbyPharmacyId === option.id;
                                  return (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => applyNearbyPharmacy(option.id)}
                                    className={cn(
                                      "w-full rounded-2xl border bg-white px-4 py-3 text-left transition-all",
                                      selected
                                        ? "border-sky-300 bg-sky-50 ring-2 ring-sky-100"
                                        : "border-slate-200 hover:border-sky-200",
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <div className="text-sm font-semibold text-slate-900">{option.name}</div>
                                        <div className="mt-1 text-sm text-slate-600">
                                          {[stripCountrySuffix(option.address), option.city, option.postal_code]
                                            .filter(Boolean)
                                            .join(", ")}
                                        </div>
                                        {option.phone ? (
                                          <div className="mt-1 text-xs text-slate-500">{option.phone}</div>
                                        ) : null}
                                      </div>
                                      <div className="shrink-0 text-xs font-semibold text-sky-700">
                                        {option.distance_label || "Nearby"}
                                      </div>
                                    </div>
                                    </button>
                                  );
                                })}
                                {!filteredBimblePharmacies.length ? (
                                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                                    No pharmacies match your search.
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                      </div>
                    ) : null}

                    {bookingDraft.pharmacy_choice === "bimble" ? (
                      <div className="space-y-4 rounded-[24px] border border-sky-100 bg-sky-50/50 p-5">
                        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                          <Clock className="mr-2 inline h-4 w-4 text-sky-700" />
                          {bookingDraft.fulfillment === "delivery"
                            ? selectedBimblePharmacy?.delivery_eta_label
                              ? `We will deliver your order in ${selectedBimblePharmacy.delivery_eta_label}.`
                              : "We will deliver your order as quickly as possible."
                            : "Bimble pharmacy is the fastest pickup option."}
                        </div>
                        {bookingDraft.preferred_pharmacy_name ? (
                          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
                            <div className="font-semibold text-slate-900">
                              {bookingDraft.preferred_pharmacy_name}
                            </div>
                            <div className="mt-1 text-slate-600">
                              {[
                                stripCountrySuffix(bookingDraft.preferred_pharmacy_address),
                                bookingDraft.preferred_pharmacy_city,
                                bookingDraft.preferred_pharmacy_postal_code,
                              ]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {bookingMessage ? (
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {bookingMessage}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (bookingStep === "problem") {
                        setBookingOpen(false);
                        resetBookingFlow();
                      } else {
                        goToPreviousBookingStep();
                      }
                    }}
                    disabled={isBooking}
                  >
                    {bookingStep === "problem" ? "Cancel" : "Back"}
                  </Button>
                  {bookingStep !== "pharmacy" ? (
                    <Button onClick={goToNextBookingStep} disabled={isBooking}>
                      Continue
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={handleCompleteBooking} disabled={isBooking}>
                      {isBooking ? "Completing..." : "Complete booking"}
                    </Button>
                  )}
                </div>
              </div>
            )}

          </SectionCard>
        ) : null}

        {activeSection === "history" ? (
          <SectionCard
            title="History"
            subtitle="Review completed or cancelled appointments."
            icon={<FileClock className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {pastAppointments.length ? (
                pastAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.appointment_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {appointment.service_name || "General appointment"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {appointment.clinic_name || "Clinic pending"} · {appointment.status}
                        </div>
                        {appointment.fulfillment ? (
                          <div className="mt-2 text-sm text-slate-600">
                            {appointment.fulfillment === "pickup" ? "Pickup" : "Delivery"} ·{" "}
                            {appointment.pharmacy_choice === "preferred"
                              ? appointment.preferred_pharmacy_name || "Preferred pharmacy"
                              : "Bimble pharmacy"}
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm text-slate-500">
                        <CanadianTime
                          value={appointment.completed_at || appointment.cancelled_at || appointment.queued_at}
                          fallback="Not available"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Past appointments will appear here once a visit is completed or cancelled.
                </div>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "requests" ? (
          <SectionCard
            title="Requests"
            subtitle="Track prescriptions, lab requests, and reschedules."
            icon={<NotebookPen className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {requestMessage ? (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  {requestMessage}
                </div>
              ) : null}
              {requestableAppointments.length ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">Request documents from your clinic</div>
                  <div className="mt-1 text-sm text-slate-600">
                    Choose the visit and send the request directly to the clinic that treated you.
                  </div>
                  <div className="mt-4 space-y-3">
                    {requestableAppointments.slice(0, 5).map((appointment) => (
                      <div
                        key={appointment.appointment_id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {appointment.clinic_name}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                              {appointment.chief_complaint || appointment.service_name || "Follow-up request"}
                            </div>
                            {(appointment.appointment_date || appointment.appointment_time) ? (
                              <div className="mt-1 text-xs text-slate-500">
                                {appointment.appointment_date || "Date pending"}
                                {appointment.appointment_time ? ` · ${appointment.appointment_time}` : ""}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              disabled={requestActionKey === `${appointment.appointment_id}:PRESCRIPTION`}
                              onClick={() =>
                                void handleCreateDocumentRequest(appointment, "PRESCRIPTION")
                              }
                            >
                              Request prescription
                            </Button>
                            <Button
                              variant="outline"
                              disabled={requestActionKey === `${appointment.appointment_id}:LAB_REPORT`}
                              onClick={() => void handleCreateDocumentRequest(appointment, "LAB_REPORT")}
                            >
                              Request lab report
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Once a clinic accepts or completes your visit, you can request prescriptions and lab reports here.
                </div>
              )}
              {requests.length ? (
                requests.slice(0, 5).map((request) => (
                  <div key={request.request_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{request.request_type}</div>
                        <div className="mt-1 text-sm text-slate-600">Status: {request.status}</div>
                        {request.clinic_name ? (
                          <div className="mt-1 text-sm text-slate-600">Clinic: {request.clinic_name}</div>
                        ) : null}
                        {request.patient_message || request.details ? (
                          <div className="mt-2 text-sm text-slate-600">
                            {request.patient_message || request.details}
                          </div>
                        ) : null}
                        {request.request_type === "RESCHEDULE" &&
                        (request.requested_appointment_date || request.requested_appointment_time) ? (
                          <div className="mt-2 text-sm text-slate-600">
                            Requested slot: {request.requested_appointment_date || "Date pending"}
                            {request.requested_appointment_time ? ` · ${request.requested_appointment_time}` : ""}
                          </div>
                        ) : null}
                        {request.clinic_response ? (
                          <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                            Clinic update: {request.clinic_response}
                          </div>
                        ) : null}
                        {request.attachment_name ? (
                          <div className="mt-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                            <div className="flex flex-wrap items-center gap-3">
                              <span>Document ready: {request.attachment_name}</span>
                                <Button
                                  variant="outline"
                                  className="h-8 rounded-xl px-3 text-xs"
                                  disabled={downloadingRequestId === request.request_id}
                                  onClick={() => void handleDownloadRequestAttachment(request)}
                                >
                                  {downloadingRequestId === request.request_id ? "Downloading..." : "Download document"}
                                </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="text-sm text-slate-500">
                        <CanadianTime value={request.created_at} fallback="Not available" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  Your portal requests will appear here.
                </div>
              )}
            </div>
          </SectionCard>
        ) : null}

        {activeSection === "family" ? (
          <SectionCard
            title="Family members"
            icon={<Users className="h-5 w-5" />}
            action={
              <Button
                variant="outline"
                size={isFamilyFormOpen ? "icon" : "default"}
                className={cn(
                  "rounded-full",
                  isFamilyFormOpen
                    ? "border-slate-300 bg-slate-50 text-slate-900 shadow-sm hover:bg-slate-100"
                    : "",
                )}
                aria-label={isFamilyFormOpen ? "Cancel family member form" : "Add family member"}
                onClick={() => setIsFamilyFormOpen((current) => !current)}
              >
                {isFamilyFormOpen ? (
                  <X className="h-4 w-4 stroke-[3]" />
                ) : (
                  <span>Add family member</span>
                )}
              </Button>
            }
          >
            {isFamilyFormOpen ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Add a family member</h3>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm text-slate-700">
                    First name
                    <Input
                      value={familyForm.first_name}
                      onChange={(event) => updateFamilyField("first_name", event.target.value)}
                      autoCapitalize="words"
                    />
                    {familyFormErrors.first_name ? (
                      <div className="text-xs text-rose-600">{familyFormErrors.first_name}</div>
                    ) : null}
                  </label>
                  <label className="grid gap-1.5 text-sm text-slate-700">
                    Last name
                    <Input
                      value={familyForm.last_name}
                      onChange={(event) => updateFamilyField("last_name", event.target.value)}
                      autoCapitalize="words"
                    />
                    {familyFormErrors.last_name ? (
                      <div className="text-xs text-rose-600">{familyFormErrors.last_name}</div>
                    ) : null}
                  </label>
                  <label className="grid gap-1.5 text-sm text-slate-700">
                    Relationship
                    <Input
                      value={familyForm.relationship_label}
                      onChange={(event) => updateFamilyField("relationship_label", event.target.value)}
                      autoCapitalize="words"
                    />
                    {familyFormErrors.relationship_label ? (
                      <div className="text-xs text-rose-600">{familyFormErrors.relationship_label}</div>
                    ) : null}
                  </label>
                  <label className="grid gap-1.5 text-sm text-slate-700">
                    Date of birth
                    <Input
                      type="date"
                      value={familyForm.date_of_birth}
                      max={getCanadaPacificDateKey()}
                      onChange={(event) => updateFamilyField("date_of_birth", event.target.value)}
                    />
                    {familyFormErrors.date_of_birth ? (
                      <div className="text-xs text-rose-600">{familyFormErrors.date_of_birth}</div>
                    ) : null}
                  </label>
                  <label className="grid gap-1.5 text-sm text-slate-700 sm:col-span-2">
                    PHN
                    <Input
                      value={familyForm.phn}
                      onChange={(event) => updateFamilyField("phn", event.target.value)}
                      inputMode="numeric"
                      maxLength={10}
                    />
                    {familyFormErrors.phn ? (
                      <div className="text-xs text-rose-600">{familyFormErrors.phn}</div>
                    ) : null}
                  </label>
                  <label className="grid gap-1.5 text-sm text-slate-700 sm:col-span-2">
                    Notes
                    <Textarea
                      value={familyForm.notes}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Optional notes"
                      className="min-h-[92px]"
                    />
                  </label>
                </div>

                {familyMessage ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                    {familyMessage}
                  </div>
                ) : null}

                <div className="mt-3 flex items-center gap-3">
                  <Button onClick={handleAddFamilyMember} disabled={isSavingFamily}>
                    {isSavingFamily ? "Saving..." : "Add family member"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsFamilyFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {familyMembers.length ? (
              <div className="mt-5 space-y-3">
                {familyMembers.slice(0, 5).map((member) => (
                  <div
                    key={member.family_member_id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">{member.relationship_label}</div>
                        <div className="mt-2 grid gap-1 text-xs text-slate-500">
                          <div>DOB: {member.date_of_birth || "Not available"}</div>
                          <div>PHN: {member.phn || "Not available"}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => void handleDeleteFamilyMember(member.family_member_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>
        ) : null}
      </main>
    </div>
  );
}
