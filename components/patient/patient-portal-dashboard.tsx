"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardPlus,
  Clock,
  FileClock,
  HeartPulse,
  LoaderCircle,
  LogOut,
  MapPin,
  NotebookPen,
  Package,
  Pill,
  Truck,
  Users,
  Video,
} from "lucide-react";
import { CanadianTime } from "@/components/canadian-time";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { symptomSuggestions } from "@/components/homepage/content";
import {
  createPatientDirectAppointment,
  createPatientFamilyMember,
  deletePatientFamilyMember,
  fetchPatientAppointments,
  fetchPatientClinics,
  fetchPatientFamilyMembers,
  fetchPatientProfile,
  fetchPatientRequests,
  fetchPatientServices,
  updatePatientProfile,
} from "@/lib/api/patient";
import { fetchPatientIntakeSlots } from "@/lib/api/patient-intake";
import { clearPatientLoginSession, readPatientLoginSession } from "@/lib/patient/session";
import type {
  PatientFulfillment,
  PatientFamilyMember,
  PatientLoginSession,
  PatientPharmacyChoice,
  PatientPortalAppointment,
  PatientPortalAppointmentsPayload,
  PatientPortalClinic,
  PatientPortalRequest,
  PatientPortalService,
  PatientProfile,
  PatientVisitType,
} from "@/lib/patient/types";
import { formatCanadaPacificDateKey, getCanadaPacificDateKey, shiftCanadaPacificDateKey } from "@/lib/time-zone";
import { cn } from "@/lib/utils";

type AppointmentNotesState = Record<number, string>;
type BookingStep = "details" | "visit_type" | "slot" | "fulfillment" | "pharmacy";

type NearbyPharmacyOption = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  distanceLabel: string;
};

type ProfileDraft = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
};

const emptyProfileDraft: ProfileDraft = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  province: "",
  postal_code: "",
};

const emptyFamilyForm = {
  first_name: "",
  last_name: "",
  relationship_label: "",
  date_of_birth: "",
  phone: "",
  email: "",
  phn: "",
  notes: "",
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

const NEARBY_PHARMACY_OPTIONS: NearbyPharmacyOption[] = [
  {
    id: "main-street-pharmacy",
    name: "Main Street Pharmacy",
    address: "123 Main St",
    city: "Vancouver",
    postalCode: "V6B 1A1",
    phone: "(604) 555-0123",
    distanceLabel: "0.8 km",
  },
  {
    id: "west-coast-care-pharmacy",
    name: "West Coast Care Pharmacy",
    address: "2450 Burrard St",
    city: "Vancouver",
    postalCode: "V6J 3J2",
    phone: "(604) 555-0188",
    distanceLabel: "1.2 km",
  },
  {
    id: "oakridge-community-pharmacy",
    name: "Oakridge Community Pharmacy",
    address: "650 W 41st Ave",
    city: "Vancouver",
    postalCode: "V5Z 2M9",
    phone: "(604) 555-0144",
    distanceLabel: "2.1 km",
  },
  {
    id: "burnaby-central-pharmacy",
    name: "Burnaby Central Pharmacy",
    address: "4550 Kingsway",
    city: "Burnaby",
    postalCode: "V5H 2A9",
    phone: "(604) 555-0194",
    distanceLabel: "3.4 km",
  },
  {
    id: "surrey-gateway-pharmacy",
    name: "Surrey Gateway Pharmacy",
    address: "10280 120 St",
    city: "Surrey",
    postalCode: "V3V 4G1",
    phone: "(604) 555-0166",
    distanceLabel: "4.0 km",
  },
  {
    id: "richmond-medical-pharmacy",
    name: "Richmond Medical Pharmacy",
    address: "8171 Ackroyd Rd",
    city: "Richmond",
    postalCode: "V6X 3K1",
    phone: "(604) 555-0177",
    distanceLabel: "4.6 km",
  },
];

const emptyBookingDraft = {
  clinic_id: "",
  problem_label: "",
  service_id: "",
  chief_complaint_details: "",
  visit_type: "" as PatientVisitType | "",
  appointment_date: "",
  appointment_time: "",
  fulfillment: "" as PatientFulfillment | "",
  pharmacy_choice: "" as PatientPharmacyChoice | "",
  preferred_pharmacy_name: "",
  preferred_pharmacy_address: "",
  preferred_pharmacy_city: "",
  preferred_pharmacy_postal_code: "",
  preferred_pharmacy_phone: "",
};

function nextDates(count: number): string[] {
  const base = getCanadaPacificDateKey();
  return Array.from({ length: count }, (_, index) => shiftCanadaPacificDateKey(base, index));
}

function formatPhoneInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function normalizePostalPrefix(value: string) {
  return value.replace(/\s/g, "").toUpperCase().slice(0, 3);
}

function getNearbyPharmacies(city: string, postalCode: string) {
  const normalizedCity = city.trim().toLowerCase();
  const postalPrefix = normalizePostalPrefix(postalCode);

  return [...NEARBY_PHARMACY_OPTIONS].sort((a, b) => {
    const aMatchesCity = normalizedCity && a.city.toLowerCase() === normalizedCity ? 1 : 0;
    const bMatchesCity = normalizedCity && b.city.toLowerCase() === normalizedCity ? 1 : 0;
    if (aMatchesCity !== bMatchesCity) return bMatchesCity - aMatchesCity;

    const aMatchesPostal = postalPrefix && a.postalCode.replace(/\s/g, "").startsWith(postalPrefix) ? 1 : 0;
    const bMatchesPostal = postalPrefix && b.postalCode.replace(/\s/g, "").startsWith(postalPrefix) ? 1 : 0;
    if (aMatchesPostal !== bMatchesPostal) return bMatchesPostal - aMatchesPostal;

    return a.distanceLabel.localeCompare(b.distanceLabel, undefined, { numeric: true });
  });
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
    const match = services.find(
      (service) => normalizeServiceName(service.service_name).includes(normalizedHint),
    );
    if (match) return String(match.service_id);
  }
  return "";
}

function SectionCard({
  id,
  title,
  subtitle,
  icon,
  children,
}: {
  id?: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 rounded-[22px] border border-border/70 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-start gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function PatientPortalDashboard() {
  const router = useRouter();
  const [session, setSession] = useState<PatientLoginSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeSection, setActiveSection] = useState("profile");

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PatientPortalAppointmentsPayload | null>(null);
  const [requests, setRequests] = useState<PatientPortalRequest[]>([]);
  const [familyMembers, setFamilyMembers] = useState<PatientFamilyMember[]>([]);
  const [clinics, setClinics] = useState<PatientPortalClinic[]>([]);
  const [services, setServices] = useState<PatientPortalService[]>([]);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [bookingDraft, setBookingDraft] = useState(emptyBookingDraft);
  const [bookingStep, setBookingStep] = useState<BookingStep>("details");
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>(TIME_SLOTS);
  const [bookingMessage, setBookingMessage] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const [familyForm, setFamilyForm] = useState(emptyFamilyForm);
  const [familyMessage, setFamilyMessage] = useState("");
  const [isSavingFamily, setIsSavingFamily] = useState(false);

  const nearbyPharmacies = useMemo(
    () => getNearbyPharmacies(profileDraft.city, profileDraft.postal_code),
    [profileDraft.city, profileDraft.postal_code],
  );

  const selectedNearbyPharmacyId = useMemo(() => {
    const match = nearbyPharmacies.find(
      (option) =>
        option.name === bookingDraft.preferred_pharmacy_name &&
        option.address === bookingDraft.preferred_pharmacy_address &&
        option.city === bookingDraft.preferred_pharmacy_city &&
        option.postalCode === bookingDraft.preferred_pharmacy_postal_code &&
        option.phone === bookingDraft.preferred_pharmacy_phone,
    );
    return match?.id ?? "";
  }, [bookingDraft, nearbyPharmacies]);

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

    let isCancelled = false;

    async function loadPortalData() {
      setLoadError("");
      try {
        const [
          nextProfile,
          nextAppointments,
          nextRequests,
          nextFamilyMembers,
          nextClinics,
          nextServices,
        ] = await Promise.all([
          fetchPatientProfile(accessToken),
          fetchPatientAppointments(accessToken),
          fetchPatientRequests(accessToken),
          fetchPatientFamilyMembers(accessToken),
          fetchPatientClinics(accessToken),
          fetchPatientServices(),
        ]);

        if (isCancelled) return;

        setProfile(nextProfile);
        setAppointments(nextAppointments);
        setRequests(nextRequests);
        setFamilyMembers(nextFamilyMembers);
        setClinics(nextClinics);
        setServices(nextServices);
        setProfileDraft({
          first_name: nextProfile.first_name ?? "",
          last_name: nextProfile.last_name ?? "",
          phone: nextProfile.phone ?? "",
          email: nextProfile.email ?? "",
          address_line_1: nextProfile.address_line_1 ?? "",
          address_line_2: nextProfile.address_line_2 ?? "",
          city: nextProfile.city ?? "",
          province: nextProfile.province ?? "",
          postal_code: nextProfile.postal_code ?? "",
        });
      } catch (error) {
        if (isCancelled) return;
        setLoadError(
          error instanceof Error
            ? error.message
            : "Could not load the patient portal right now.",
        );
      }
    }

    void loadPortalData();

    return () => {
      isCancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (bookingDraft.clinic_id || clinics.length === 0) return;
    if (clinics.length === 1) {
      setBookingDraft((current) => ({ ...current, clinic_id: String(clinics[0]!.clinic_id) }));
    }
  }, [bookingDraft.clinic_id, clinics]);

  useEffect(() => {
    if (!isBookingFormOpen || bookingStep !== "slot" || !bookingDraft.visit_type) return;
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
  }, [bookingDraft.visit_type, bookingStep, isBookingFormOpen]);

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

  function resetBookingFlow() {
    setBookingDraft((current) => ({
      ...emptyBookingDraft,
      clinic_id:
        clinics.length === 1
          ? String(clinics[0]!.clinic_id)
          : current.clinic_id && clinics.some((clinic) => String(clinic.clinic_id) === current.clinic_id)
            ? current.clinic_id
            : "",
    }));
    setBookingStep("details");
    setAvailableDates([]);
    setAvailableTimes(TIME_SLOTS);
  }

  function applyNearbyPharmacy(optionId: string) {
    const option = nearbyPharmacies.find((item) => item.id === optionId);
    if (!option) return;
    setBookingDraft((current) => ({
      ...current,
      preferred_pharmacy_name: option.name,
      preferred_pharmacy_address: option.address,
      preferred_pharmacy_city: option.city,
      preferred_pharmacy_postal_code: option.postalCode,
      preferred_pharmacy_phone: option.phone,
    }));
  }

  function validateBookingStep(): boolean {
    if (bookingStep === "details") {
      if (!bookingDraft.clinic_id) {
        setBookingMessage("Please choose a clinic before continuing.");
        return false;
      }
      if (!bookingDraft.problem_label) {
        setBookingMessage("Please select the problem or reason for the visit.");
        return false;
      }
      return true;
    }
    if (bookingStep === "visit_type") {
      if (!bookingDraft.visit_type) {
        setBookingMessage("Please choose whether this visit is virtual or walk-in.");
        return false;
      }
      return true;
    }
    if (bookingStep === "slot") {
      if (!bookingDraft.appointment_date || !bookingDraft.appointment_time) {
        setBookingMessage("Please choose a date and time for the appointment.");
        return false;
      }
      return true;
    }
    if (bookingStep === "fulfillment") {
      if (!bookingDraft.fulfillment) {
        setBookingMessage("Please choose pickup or delivery to continue.");
        return false;
      }
      return true;
    }
    if (bookingStep === "pharmacy") {
      if (!bookingDraft.pharmacy_choice) {
        setBookingMessage("Please choose Bimble pharmacy or your preferred pharmacy.");
        return false;
      }
      if (
        bookingDraft.pharmacy_choice === "preferred" &&
        (!bookingDraft.preferred_pharmacy_name ||
          !bookingDraft.preferred_pharmacy_address ||
          !bookingDraft.preferred_pharmacy_city ||
          !bookingDraft.preferred_pharmacy_postal_code ||
          !bookingDraft.preferred_pharmacy_phone)
      ) {
        setBookingMessage("Please complete the preferred pharmacy details.");
        return false;
      }
      return true;
    }
    return true;
  }

  function goToNextBookingStep() {
    if (!validateBookingStep()) return;
    setBookingMessage("");
    setBookingStep((current) => {
      const order: BookingStep[] = ["details", "visit_type", "slot", "fulfillment", "pharmacy"];
      const nextIndex = order.indexOf(current) + 1;
      return order[nextIndex] ?? current;
    });
  }

  function goToPreviousBookingStep() {
    setBookingMessage("");
    setBookingStep((current) => {
      const order: BookingStep[] = ["details", "visit_type", "slot", "fulfillment", "pharmacy"];
      const previousIndex = order.indexOf(current) - 1;
      return order[previousIndex] ?? current;
    });
  }

  async function handleSaveProfile() {
    if (!session) return;
    setIsSavingProfile(true);
    setProfileMessage("");

    try {
      const updated = await updatePatientProfile(session.accessToken, profileDraft);
      setProfile(updated);
      setProfileDraft({
        first_name: updated.first_name ?? "",
        last_name: updated.last_name ?? "",
        phone: updated.phone ?? "",
        email: updated.email ?? "",
        address_line_1: updated.address_line_1 ?? "",
        address_line_2: updated.address_line_2 ?? "",
        city: updated.city ?? "",
        province: updated.province ?? "",
        postal_code: updated.postal_code ?? "",
      });
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileMessage(
        error instanceof Error ? error.message : "Could not save the profile.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleBookAppointment() {
    if (!session) return;
    if (!validateBookingStep()) {
      return;
    }

    setIsBooking(true);
    setBookingMessage("");

    try {
      await createPatientDirectAppointment(session.accessToken, {
        clinic_id: Number(bookingDraft.clinic_id),
        service_id: bookingDraft.service_id ? Number(bookingDraft.service_id) : undefined,
        chief_complaint: [
          bookingDraft.problem_label.trim(),
          bookingDraft.chief_complaint_details.trim(),
        ]
          .filter(Boolean)
          .join(": ") || undefined,
        visit_type: bookingDraft.visit_type || undefined,
        appointment_date: bookingDraft.appointment_date || undefined,
        appointment_time: bookingDraft.appointment_time || undefined,
        fulfillment: bookingDraft.fulfillment || undefined,
        pharmacy_choice: bookingDraft.pharmacy_choice || undefined,
        preferred_pharmacy_name:
          bookingDraft.pharmacy_choice === "preferred"
            ? bookingDraft.preferred_pharmacy_name.trim() || undefined
            : undefined,
        preferred_pharmacy_address:
          bookingDraft.pharmacy_choice === "preferred"
            ? bookingDraft.preferred_pharmacy_address.trim() || undefined
            : undefined,
        preferred_pharmacy_city:
          bookingDraft.pharmacy_choice === "preferred"
            ? bookingDraft.preferred_pharmacy_city.trim() || undefined
            : undefined,
        preferred_pharmacy_postal_code:
          bookingDraft.pharmacy_choice === "preferred"
            ? bookingDraft.preferred_pharmacy_postal_code.trim() || undefined
            : undefined,
        preferred_pharmacy_phone:
          bookingDraft.pharmacy_choice === "preferred"
            ? bookingDraft.preferred_pharmacy_phone.trim() || undefined
            : undefined,
        care_location:
          clinics.find((clinic) => String(clinic.clinic_id) === bookingDraft.clinic_id)
            ?.clinic_display_name || undefined,
      });
      resetBookingFlow();
      setIsBookingFormOpen(false);
      setBookingMessage("Appointment booked successfully.");
      await refreshPortalData();
    } catch (error) {
      setBookingMessage(
        error instanceof Error ? error.message : "Could not book the appointment.",
      );
    } finally {
      setIsBooking(false);
    }
  }

  async function handleAddFamilyMember() {
    if (!session) return;
    setIsSavingFamily(true);
    setFamilyMessage("");

    try {
      await createPatientFamilyMember(session.accessToken, {
        first_name: familyForm.first_name,
        last_name: familyForm.last_name,
        relationship_label: familyForm.relationship_label,
        date_of_birth: familyForm.date_of_birth || undefined,
        phone: familyForm.phone || undefined,
        email: familyForm.email || undefined,
        phn: familyForm.phn || undefined,
        notes: familyForm.notes || undefined,
      });
      setFamilyForm(emptyFamilyForm);
      setFamilyMessage("Family member added successfully.");
      await refreshPortalData();
    } catch (error) {
      setFamilyMessage(
        error instanceof Error ? error.message : "Could not add the family member.",
      );
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

  function handleSignOut() {
    clearPatientLoginSession();
    router.replace("/patient-portal");
  }

  if (isBootstrapping || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500">
        <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
        Loading your patient workspace...
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] xl:gap-10">
      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-[24px] border border-sky-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-200 bg-sky-50 text-sky-700">
              <HeartPulse className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {profile?.first_name || "Patient"} {profile?.last_name || "Portal"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage appointments, request follow-ups, keep your records current, and add family members from one place.
            </p>
          </div>

          <Button variant="outline" className="h-11 rounded-2xl" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Active appointments",
              value: dashboard?.active_appointments ?? 0,
              icon: <CalendarDays className="h-4 w-4" />,
            },
            {
              label: "Past appointments",
              value: (appointments?.past.length ?? 0),
              icon: <FileClock className="h-4 w-4" />,
            },
            {
              label: "Open requests",
              value: dashboard?.open_requests_count ?? 0,
              icon: <NotebookPen className="h-4 w-4" />,
            },
            {
              label: "Family members",
              value: dashboard?.family_members_count ?? 0,
              icon: <Users className="h-4 w-4" />,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-white/90 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-sm">{item.label}</span>
                {item.icon}
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

        {activeSection === "profile" ? (
          <SectionCard
            id="profile-details"
            title="Profile details"
            subtitle="Keep your contact information up to date."
            icon={<Users className="h-5 w-5" />}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm text-slate-700">
                First name
                <Input
                  value={profileDraft.first_name}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, first_name: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Last name
                <Input
                  value={profileDraft.last_name}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, last_name: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Phone
                <Input
                  value={profileDraft.phone}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Email
                <Input
                  type="email"
                  value={profileDraft.email}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
                <label className="grid gap-2 text-sm text-slate-700">
                  Address line 1
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
                  Address line 2
                  <Input
                    value={profileDraft.address_line_2}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        address_line_2: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm text-slate-700">
                City
                <Input
                  value={profileDraft.city}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, city: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Province
                <Input
                  value={profileDraft.province}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, province: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Postal code
                <Input
                  value={profileDraft.postal_code}
                  onChange={(event) =>
                    setProfileDraft((current) => ({ ...current, postal_code: event.target.value }))
                  }
                />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Status
                <Input value={profile?.status ?? ""} disabled />
              </label>
            </div>

            {profileMessage ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {profileMessage}
              </div>
            ) : null}

          <div className="mt-5">
            <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
              {isSavingProfile ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title="Book an appointment"
          subtitle="Pick the problem, visit type, appointment slot, and pharmacy preferences for the next visit."
          icon={<ClipboardPlus className="h-5 w-5" />}
        >
          {!isBookingFormOpen ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-sky-100 bg-sky-50/70 p-4 text-sm text-slate-700">
                Existing patients can book another visit from here. We&apos;ll guide them through the problem, visit type, date and time, then pickup or delivery pharmacy preferences before submitting the booking.
              </div>
              <Button
                onClick={() => {
                  setIsBookingFormOpen(true);
                  setBookingMessage("");
                  setBookingStep("details");
                }}
              >
                Book appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "details", label: "Problem" },
                  { id: "visit_type", label: "Visit type" },
                  { id: "slot", label: "Schedule" },
                  { id: "fulfillment", label: "Pickup / delivery" },
                  { id: "pharmacy", label: "Pharmacy" },
                ].map((item, index) => {
                  const order: BookingStep[] = ["details", "visit_type", "slot", "fulfillment", "pharmacy"];
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

              {bookingStep === "details" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm text-slate-700">
                    Clinic
                    <select
                      className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                      value={bookingDraft.clinic_id}
                      onChange={(event) =>
                        setBookingDraft((current) => ({ ...current, clinic_id: event.target.value }))
                      }
                    >
                      <option value="">Select a clinic</option>
                      {clinics.map((clinic) => (
                        <option key={clinic.clinic_id} value={clinic.clinic_id}>
                          {clinic.clinic_display_name}
                          {clinic.city ? ` - ${clinic.city}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

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
                    Extra details for the clinic
                    <Textarea
                      value={bookingDraft.chief_complaint_details}
                      onChange={(event) =>
                        setBookingDraft((current) => ({
                          ...current,
                          chief_complaint_details: event.target.value,
                        }))
                      }
                      placeholder="Optional details that will help the clinic prepare for the visit."
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
                      description: "Visit the clinic in person at your selected time.",
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Choose a date</p>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                      {(availableDates.length ? availableDates : nextDates(14)).map((value) => {
                        const selected = bookingDraft.appointment_date === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setBookingDraft((current) => ({ ...current, appointment_date: value }))
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
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Choose a time</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {availableTimes.map((value) => {
                        const selected = bookingDraft.appointment_time === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setBookingDraft((current) => ({ ...current, appointment_time: value }))
                            }
                            className={cn(
                              "rounded-2xl border px-3 py-2 text-sm font-medium transition-all",
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
                      description: "Pick up your medication from the pharmacy you choose next.",
                      icon: <Package className="h-6 w-6" />,
                    },
                    {
                      value: "delivery" as PatientFulfillment,
                      title: "Delivery",
                      description: "Have the medication delivered after the prescription is ready.",
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
                          preferred_pharmacy_name: "",
                          preferred_pharmacy_address: "",
                          preferred_pharmacy_city: "",
                          preferred_pharmacy_postal_code: "",
                          preferred_pharmacy_phone: "",
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
                          ? "Fastest option for delivery after the prescription is ready."
                          : "Quickest option for pickup after the prescription is prepared."}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBookingDraft((current) => ({
                          ...current,
                          pharmacy_choice: "preferred",
                        }));
                        if (!selectedNearbyPharmacyId && nearbyPharmacies.length > 0) {
                          applyNearbyPharmacy(nearbyPharmacies[0]!.id);
                        }
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
                        Use the pharmacy the patient already prefers for pickup or delivery.
                      </p>
                    </button>
                  </div>

                  {bookingDraft.pharmacy_choice === "preferred" ? (
                    <div className="space-y-4 rounded-[24px] border border-sky-100 bg-sky-50/50 p-5">
                      <label className="grid gap-2 text-sm text-slate-700">
                        Nearby pharmacies
                        <select
                          className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                          value={selectedNearbyPharmacyId}
                          onChange={(event) => applyNearbyPharmacy(event.target.value)}
                        >
                          <option value="">Select a nearby pharmacy</option>
                          {nearbyPharmacies.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name} - {option.distanceLabel} - {option.city}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm text-slate-700">
                          Pharmacy name
                          <Input
                            value={bookingDraft.preferred_pharmacy_name}
                            onChange={(event) =>
                              setBookingDraft((current) => ({
                                ...current,
                                preferred_pharmacy_name: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                          Phone number
                          <Input
                            value={bookingDraft.preferred_pharmacy_phone}
                            onChange={(event) =>
                              setBookingDraft((current) => ({
                                ...current,
                                preferred_pharmacy_phone: formatPhoneInput(event.target.value),
                              }))
                            }
                          />
                        </label>
                      </div>
                      <label className="grid gap-2 text-sm text-slate-700">
                        Street address
                        <Input
                          value={bookingDraft.preferred_pharmacy_address}
                          onChange={(event) =>
                            setBookingDraft((current) => ({
                              ...current,
                              preferred_pharmacy_address: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm text-slate-700">
                          City
                          <Input
                            value={bookingDraft.preferred_pharmacy_city}
                            onChange={(event) =>
                              setBookingDraft((current) => ({
                                ...current,
                                preferred_pharmacy_city: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <label className="grid gap-2 text-sm text-slate-700">
                          Postal code
                          <Input
                            value={bookingDraft.preferred_pharmacy_postal_code}
                            onChange={(event) =>
                              setBookingDraft((current) => ({
                                ...current,
                                preferred_pharmacy_postal_code: event.target.value.toUpperCase(),
                              }))
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}

                  {bookingDraft.pharmacy_choice === "bimble" ? (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                      {bookingDraft.fulfillment === "delivery" ? (
                        <>
                          <Clock className="mr-2 inline h-4 w-4 text-sky-700" />
                          Delivery through Bimble pharmacy is the fastest option once the prescription is ready.
                        </>
                      ) : (
                        <>
                          <Clock className="mr-2 inline h-4 w-4 text-sky-700" />
                          Pickup through Bimble pharmacy is the quickest preparation option.
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {bookingMessage ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {bookingMessage}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (bookingStep === "details") {
                      setIsBookingFormOpen(false);
                      resetBookingFlow();
                      setBookingMessage("");
                      return;
                    }
                    goToPreviousBookingStep();
                  }}
                  disabled={isBooking}
                >
                  {bookingStep === "details" ? "Cancel" : "Back"}
                </Button>
                {bookingStep !== "pharmacy" ? (
                  <Button onClick={goToNextBookingStep} disabled={isBooking}>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button onClick={handleBookAppointment} disabled={isBooking}>
                    {isBooking ? "Booking..." : "Complete booking"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Current appointments"
        subtitle="Cancel, reschedule, or request prescriptions and lab reports for active appointments."
        icon={<CalendarDays className="h-5 w-5" />}
      >
        <div className="space-y-4">
          {appointments?.current.length ? appointments.current.map((appointment) => (
            <div key={appointment.appointment_id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">
                    {appointment.service_name || "General appointment"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {appointment.clinic_name || "Clinic pending"} · {appointment.status} · Created{" "}
                    <CanadianTime value={appointment.queued_at} fallback="Not available" />
                  </div>
                  {appointment.chief_complaint ? (
                    <p className="mt-3 text-sm text-slate-700">{appointment.chief_complaint}</p>
                  ) : null}
                  {appointment.visit_type || appointment.appointment_date || appointment.appointment_time ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {(appointment.visit_type || "").replace("_", "-") || "visit"} ·{" "}
                      {appointment.appointment_date || "Date pending"} ·{" "}
                      {appointment.appointment_time || "Time pending"}
                    </p>
                  ) : null}
                  {appointment.fulfillment ? (
                    <p className="mt-2 text-sm text-slate-600">
                      {appointment.fulfillment === "pickup" ? "Pickup" : "Delivery"} ·{" "}
                      {appointment.pharmacy_choice === "preferred"
                        ? appointment.preferred_pharmacy_name || "Preferred pharmacy"
                        : "Bimble pharmacy"}
                    </p>
                  ) : null}
                  {appointment.notes ? (
                    <p className="mt-2 text-sm text-slate-600">Notes: {appointment.notes}</p>
                  ) : null}
                </div>
                <div className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  {appointment.channel}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                <Textarea
                  value={appointmentNotes[appointment.appointment_id] ?? ""}
                  onChange={(event) => setAppointmentNotes((current) => ({
                    ...current,
                    [appointment.appointment_id]: event.target.value,
                  }))}
                  placeholder="Optional note for cancellation, reschedule, prescription, or lab request."
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void handleAppointmentAction("cancel", appointment)}
                    disabled={busyAppointmentId === appointment.appointment_id}
                  >
                    Cancel appointment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleAppointmentAction("reschedule", appointment)}
                    disabled={busyAppointmentId === appointment.appointment_id}
                  >
                    Reschedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleAppointmentAction("prescription", appointment)}
                    disabled={busyAppointmentId === appointment.appointment_id}
                  >
                    <Pill className="h-4 w-4" />
                    Prescription
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleAppointmentAction("lab_report", appointment)}
                    disabled={busyAppointmentId === appointment.appointment_id}
                  >
                    <FlaskConical className="h-4 w-4" />
                    Lab report
                  </Button>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No active appointments right now.
            </div>
          )}
        </div>

        {appointmentMessage ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            {appointmentMessage}
          </div>
        ) : null}
      </SectionCard>

      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.95fr]">
        <SectionCard
          title="Past appointments and history"
          subtitle="Review completed or cancelled appointments and the notes tied to them."
          icon={<FileClock className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {appointments?.past.length ? appointments.past.map((appointment) => (
              <div key={appointment.appointment_id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">
                      {appointment.service_name || "General appointment"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {appointment.clinic_name || "Clinic pending"} · {appointment.status}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <CanadianTime
                      value={appointment.completed_at || appointment.cancelled_at || appointment.queued_at}
                      fallback="Not available"
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  {appointment.chief_complaint ? <div>Reason: {appointment.chief_complaint}</div> : null}
                  {appointment.visit_type ? (
                    <div>Visit type: {appointment.visit_type === "walk_in" ? "Walk-in" : "Virtual"}</div>
                  ) : null}
                  {appointment.appointment_date || appointment.appointment_time ? (
                    <div>
                      Slot: {appointment.appointment_date || "Date pending"}
                      {appointment.appointment_time ? ` at ${appointment.appointment_time}` : ""}
                    </div>
                  ) : null}
                  {appointment.fulfillment ? (
                    <div>
                      Fulfillment: {appointment.fulfillment === "pickup" ? "Pickup" : "Delivery"} via{" "}
                      {appointment.pharmacy_choice === "preferred"
                        ? appointment.preferred_pharmacy_name || "preferred pharmacy"
                        : "Bimble pharmacy"}
                    </div>
                  ) : null}
                  {appointment.notes ? <div>Visit notes: {appointment.notes}</div> : null}
                  {appointment.prescription_notes ? <div>Prescription: {appointment.prescription_notes}</div> : null}
                  {appointment.cancellation_reason ? <div>Cancellation reason: {appointment.cancellation_reason}</div> : null}
                </div>
              </div>
            )) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Past appointments will show up here once you complete or cancel a visit.
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Requests and follow-ups"
          subtitle="Track your reschedule, prescription, and lab report requests."
          icon={<NotebookPen className="h-5 w-5" />}
        >
          <div className="space-y-4">
            {requests.length ? requests.map((request) => (
              <div key={request.request_id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-slate-900">{request.request_type}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      Status: {request.status}
                      {request.appointment_id ? ` · Appointment #${request.appointment_id}` : ""}
                    </div>
                  </div>
                  <div className="text-sm text-slate-500">
                    <CanadianTime value={request.created_at} fallback="Not available" />
                  </div>
                </div>
                {request.details ? (
                  <p className="mt-3 text-sm text-slate-700">{request.details}</p>
                ) : null}
              </div>
            )) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Your portal requests will appear here.
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Family members"
        subtitle="Add family members so their details are easy to keep with your patient profile."
        icon={<Users className="h-5 w-5" />}
      >
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {familyMembers.length ? familyMembers.map((member) => (
              <div key={member.family_member_id} className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-900">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">{member.relationship_label}</div>
                    <div className="mt-3 grid gap-1 text-sm text-slate-700">
                      {member.date_of_birth ? <div>DOB: {member.date_of_birth}</div> : null}
                      {member.phone ? <div>Phone: {member.phone}</div> : null}
                      {member.email ? <div>Email: {member.email}</div> : null}
                      {member.phn ? <div>PHN: {member.phn}</div> : null}
                      {member.notes ? <div>Notes: {member.notes}</div> : null}
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => void handleDeleteFamilyMember(member.family_member_id)}>
                    Remove
                  </Button>
                </div>
              </div>
            )) : (
              <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No family members added yet.
              </div>
            )}
          </div>

              <div className="rounded-[24px] border border-slate-200 bg-slate-50/60 p-5">
                <h3 className="text-base font-semibold text-slate-900">Add a family member</h3>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm text-slate-700">
                    First name
                    <Input value={familyForm.first_name} onChange={(event) => setFamilyForm((current) => ({ ...current, first_name: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Last name
                    <Input value={familyForm.last_name} onChange={(event) => setFamilyForm((current) => ({ ...current, last_name: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Relationship
                    <Input value={familyForm.relationship_label} onChange={(event) => setFamilyForm((current) => ({ ...current, relationship_label: event.target.value }))} />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Phone
                    <Input value={familyForm.phone} onChange={(event) => setFamilyForm((current) => ({ ...current, phone: event.target.value }))} />
                  </label>
                </div>

                {familyMessage ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {familyMessage}
                  </div>
                ) : null}

                <div className="mt-5">
                  <Button onClick={handleAddFamilyMember} disabled={isSavingFamily}>
                    {isSavingFamily ? "Saving..." : "Add family member"}
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
