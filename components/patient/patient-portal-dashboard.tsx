"use client";

import { useEffect, useMemo, useState } from "react";
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
  createPatientFamilyMember,
  createPatientPoolAppointment,
  deletePatientFamilyMember,
  fetchPatientAppointments,
  fetchPatientFamilyMembers,
  fetchPatientProfile,
  fetchPatientRequests,
  fetchPatientServices,
  updatePatientProfile,
} from "@/lib/api/patient";
import { fetchPatientIntakeSlots } from "@/lib/api/patient-intake";
import { clearPatientLoginSession, readPatientLoginSession } from "@/lib/patient/session";
import type {
  PatientFamilyMember,
  PatientFulfillment,
  PatientLoginSession,
  PatientPharmacyChoice,
  PatientPortalAppointmentsPayload,
  PatientPortalRequest,
  PatientPortalService,
  PatientProfile,
  PatientVisitType,
} from "@/lib/patient/types";
import {
  formatCanadaPacificDateKey,
  getCanadaPacificDateKey,
  shiftCanadaPacificDateKey,
} from "@/lib/time-zone";

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

type NearbyPharmacyOption = {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  distanceLabel: string;
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
];

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

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-border/70 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-[17px] font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
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

export function PatientPortalDashboard() {
  const router = useRouter();
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
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [familyForm, setFamilyForm] = useState(emptyFamilyForm);
  const [familyMessage, setFamilyMessage] = useState("");
  const [isSavingFamily, setIsSavingFamily] = useState(false);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<BookingStep>("problem");
  const [bookingDraft, setBookingDraft] = useState<BookingDraft>(emptyBookingDraft);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>(TIME_SLOTS);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingMessage, setBookingMessage] = useState("");

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
    setBookingDraft(emptyBookingDraft);
    setBookingStep("problem");
    setBookingMessage("");
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
            <p className="mt-1 text-xs text-slate-500">
              PHN: {profile?.phn || "Not available"}
            </p>
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
                activeAppointments.map((appointment) => (
                  <div key={appointment.appointment_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-sm font-semibold text-slate-900">
                      {appointment.service_name || "General appointment"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {appointment.clinic_name || "Clinic pending"} ·{" "}
                      <CanadianTime value={appointment.queued_at} fallback="Not available" />
                    </div>
                    {appointment.visit_type || appointment.appointment_date || appointment.appointment_time ? (
                      <div className="mt-2 text-sm text-slate-600">
                        {(appointment.visit_type || "").replace("_", "-") || "visit"} ·{" "}
                        {appointment.appointment_date || "Date pending"} ·{" "}
                        {appointment.appointment_time || "Time pending"}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  No active appointments right now.
                </div>
              )}
            </div>

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
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        Choose a time
                      </p>
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
                          Use the patient&apos;s existing pharmacy for pickup or delivery.
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
                        <Clock className="mr-2 inline h-4 w-4 text-sky-700" />
                        {bookingDraft.fulfillment === "delivery"
                          ? "Bimble pharmacy is the fastest delivery option."
                          : "Bimble pharmacy is the fastest pickup option."}
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
              {requests.length ? (
                requests.slice(0, 5).map((request) => (
                  <div key={request.request_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{request.request_type}</div>
                        <div className="mt-1 text-sm text-slate-600">Status: {request.status}</div>
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
            subtitle="Add family members so their details stay with your patient profile."
            icon={<Users className="h-5 w-5" />}
          >
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="space-y-3">
                {familyMembers.length ? (
                  familyMembers.slice(0, 5).map((member) => (
                    <div key={member.family_member_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">{member.relationship_label}</div>
                        </div>
                        <Button variant="ghost" onClick={() => void handleDeleteFamilyMember(member.family_member_id)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                    No family members added yet.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Add a family member</h3>
                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-sm text-slate-700">
                    First name
                    <Input
                      value={familyForm.first_name}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, first_name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Last name
                    <Input
                      value={familyForm.last_name}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, last_name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Relationship
                    <Input
                      value={familyForm.relationship_label}
                      onChange={(event) =>
                        setFamilyForm((current) => ({
                          ...current,
                          relationship_label: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Phone
                    <Input
                      value={familyForm.phone}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label className="grid gap-2 text-sm text-slate-700">
                    Notes
                    <Textarea
                      value={familyForm.notes}
                      onChange={(event) =>
                        setFamilyForm((current) => ({ ...current, notes: event.target.value }))
                      }
                      placeholder="Optional notes"
                    />
                  </label>
                </div>

                {familyMessage ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {familyMessage}
                  </div>
                ) : null}

                <div className="mt-4">
                  <Button onClick={handleAddFamilyMember} disabled={isSavingFamily}>
                    {isSavingFamily ? "Saving..." : "Add family member"}
                  </Button>
                </div>
              </div>
            </div>
          </SectionCard>
        ) : null}
      </main>
    </div>
  );
}
