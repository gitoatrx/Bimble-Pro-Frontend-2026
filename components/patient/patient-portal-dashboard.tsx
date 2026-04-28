"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardPlus,
  FileClock,
  FlaskConical,
  HeartPulse,
  LoaderCircle,
  LogOut,
  NotebookPen,
  Pill,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelPatientAppointment,
  createPatientDirectAppointment,
  createPatientDocumentRequest,
  createPatientFamilyMember,
  createPatientRescheduleRequest,
  deletePatientFamilyMember,
  fetchPatientAppointments,
  fetchPatientClinics,
  fetchPatientDashboard,
  fetchPatientFamilyMembers,
  fetchPatientProfile,
  fetchPatientRequests,
  fetchPatientServices,
  updatePatientProfile,
} from "@/lib/api/patient";
import { clearPatientLoginSession, readPatientLoginSession } from "@/lib/patient/session";
import type {
  PatientFamilyMember,
  PatientLoginSession,
  PatientPortalAppointment,
  PatientPortalAppointmentsPayload,
  PatientPortalClinic,
  PatientPortalDashboard,
  PatientPortalRequest,
  PatientPortalService,
  PatientProfile,
} from "@/lib/patient/types";

type AppointmentNotesState = Record<number, string>;

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

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function SectionCard({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
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

  const [dashboard, setDashboard] = useState<PatientPortalDashboard | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<PatientPortalAppointmentsPayload | null>(null);
  const [requests, setRequests] = useState<PatientPortalRequest[]>([]);
  const [familyMembers, setFamilyMembers] = useState<PatientFamilyMember[]>([]);
  const [clinics, setClinics] = useState<PatientPortalClinic[]>([]);
  const [services, setServices] = useState<PatientPortalService[]>([]);

  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(emptyProfileDraft);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  const [bookingDraft, setBookingDraft] = useState({
    clinic_id: "",
    service_id: "",
    chief_complaint: "",
  });
  const [bookingMessage, setBookingMessage] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const [appointmentNotes, setAppointmentNotes] = useState<AppointmentNotesState>({});
  const [busyAppointmentId, setBusyAppointmentId] = useState<number | null>(null);
  const [appointmentMessage, setAppointmentMessage] = useState("");

  const [familyForm, setFamilyForm] = useState(emptyFamilyForm);
  const [familyMessage, setFamilyMessage] = useState("");
  const [isSavingFamily, setIsSavingFamily] = useState(false);

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
          nextDashboard,
          nextAppointments,
          nextRequests,
          nextFamilyMembers,
          nextClinics,
          nextServices,
        ] = await Promise.all([
          fetchPatientProfile(accessToken),
          fetchPatientDashboard(accessToken),
          fetchPatientAppointments(accessToken),
          fetchPatientRequests(accessToken),
          fetchPatientFamilyMembers(accessToken),
          fetchPatientClinics(accessToken),
          fetchPatientServices(),
        ]);

        if (isCancelled) return;

        setProfile(nextProfile);
        setDashboard(nextDashboard);
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

  async function refreshPortalData() {
    if (!session) return;
    const accessToken = session.accessToken;

    const [
      nextDashboard,
      nextAppointments,
      nextRequests,
      nextFamilyMembers,
    ] = await Promise.all([
      fetchPatientDashboard(accessToken),
      fetchPatientAppointments(accessToken),
      fetchPatientRequests(accessToken),
      fetchPatientFamilyMembers(accessToken),
    ]);

    setDashboard(nextDashboard);
    setAppointments(nextAppointments);
    setRequests(nextRequests);
    setFamilyMembers(nextFamilyMembers);
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
    if (!bookingDraft.clinic_id) {
      setBookingMessage("Please select a clinic before booking.");
      return;
    }

    setIsBooking(true);
    setBookingMessage("");

    try {
      await createPatientDirectAppointment(session.accessToken, {
        clinic_id: Number(bookingDraft.clinic_id),
        service_id: bookingDraft.service_id ? Number(bookingDraft.service_id) : undefined,
        chief_complaint: bookingDraft.chief_complaint.trim() || undefined,
      });
      setBookingDraft({ clinic_id: "", service_id: "", chief_complaint: "" });
      setBookingMessage("Appointment request created successfully.");
      await refreshPortalData();
    } catch (error) {
      setBookingMessage(
        error instanceof Error ? error.message : "Could not book the appointment.",
      );
    } finally {
      setIsBooking(false);
    }
  }

  async function handleAppointmentAction(
    action: "cancel" | "reschedule" | "prescription" | "lab_report",
    appointment: PatientPortalAppointment,
  ) {
    if (!session) return;

    const details = appointmentNotes[appointment.appointment_id]?.trim();
    setBusyAppointmentId(appointment.appointment_id);
    setAppointmentMessage("");

    try {
      if (action === "cancel") {
        await cancelPatientAppointment(session.accessToken, appointment.appointment_id, {
          reason: details || undefined,
        });
      } else if (action === "reschedule") {
        await createPatientRescheduleRequest(session.accessToken, appointment.appointment_id, {
          details: details || undefined,
          clinic_id: appointment.clinic_id ?? undefined,
        });
      } else {
        await createPatientDocumentRequest(session.accessToken, appointment.appointment_id, {
          request_type: action === "prescription" ? "PRESCRIPTION" : "LAB_REPORT",
          details: details || undefined,
          clinic_id: appointment.clinic_id ?? undefined,
        });
      }

      setAppointmentNotes((current) => ({ ...current, [appointment.appointment_id]: "" }));
      setAppointmentMessage("Appointment action submitted successfully.");
      await refreshPortalData();
    } catch (error) {
      setAppointmentMessage(
        error instanceof Error ? error.message : "Could not complete the appointment action.",
      );
    } finally {
      setBusyAppointmentId(null);
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
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[32px] border border-sky-200/70 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)] p-6 shadow-[0_28px_90px_rgba(14,116,144,0.10)] sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              <HeartPulse className="h-3.5 w-3.5" />
              Patient profile
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

      <div className="grid gap-8 xl:grid-cols-[1.05fr_1.3fr]">
        <SectionCard
          title="Profile details"
          subtitle="Keep your contact information up to date so clinics can reach you quickly."
          icon={<Users className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              First name
              <Input value={profileDraft.first_name} onChange={(event) => setProfileDraft((current) => ({ ...current, first_name: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              Last name
              <Input value={profileDraft.last_name} onChange={(event) => setProfileDraft((current) => ({ ...current, last_name: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              Phone
              <Input value={profileDraft.phone} onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              Email
              <Input type="email" value={profileDraft.email} onChange={(event) => setProfileDraft((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700 sm:col-span-2">
              Address line 1
              <Input value={profileDraft.address_line_1} onChange={(event) => setProfileDraft((current) => ({ ...current, address_line_1: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700 sm:col-span-2">
              Address line 2
              <Input value={profileDraft.address_line_2} onChange={(event) => setProfileDraft((current) => ({ ...current, address_line_2: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              City
              <Input value={profileDraft.city} onChange={(event) => setProfileDraft((current) => ({ ...current, city: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              Province
              <Input value={profileDraft.province} onChange={(event) => setProfileDraft((current) => ({ ...current, province: event.target.value }))} />
            </label>
            <label className="grid gap-2 text-sm text-slate-700">
              Postal code
              <Input value={profileDraft.postal_code} onChange={(event) => setProfileDraft((current) => ({ ...current, postal_code: event.target.value }))} />
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
          subtitle="Choose a clinic, select a service, and send your appointment request directly."
          icon={<ClipboardPlus className="h-5 w-5" />}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm text-slate-700">
              Clinic
              <select
                className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                value={bookingDraft.clinic_id}
                onChange={(event) => setBookingDraft((current) => ({ ...current, clinic_id: event.target.value }))}
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
              Service
              <select
                className="h-12 rounded-2xl border border-border bg-white px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                value={bookingDraft.service_id}
                onChange={(event) => setBookingDraft((current) => ({ ...current, service_id: event.target.value }))}
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.service_id} value={service.service_id}>
                    {service.service_name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-slate-700 sm:col-span-2">
              What do you need help with?
              <Textarea
                value={bookingDraft.chief_complaint}
                onChange={(event) => setBookingDraft((current) => ({ ...current, chief_complaint: event.target.value }))}
                placeholder="Describe the reason for your appointment request."
              />
            </label>
          </div>

          {bookingMessage ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {bookingMessage}
            </div>
          ) : null}

          <div className="mt-5">
            <Button onClick={handleBookAppointment} disabled={isBooking}>
              {isBooking ? "Booking..." : "Book appointment"}
            </Button>
          </div>
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
                    {appointment.clinic_name || "Clinic pending"} · {appointment.status} · Created {formatDateTime(appointment.queued_at)}
                  </div>
                  {appointment.chief_complaint ? (
                    <p className="mt-3 text-sm text-slate-700">{appointment.chief_complaint}</p>
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
                    {formatDateTime(appointment.completed_at || appointment.cancelled_at || appointment.queued_at)}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  {appointment.chief_complaint ? <div>Reason: {appointment.chief_complaint}</div> : null}
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
                  <div className="text-sm text-slate-500">{formatDateTime(request.created_at)}</div>
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
                Date of birth
                <Input type="date" value={familyForm.date_of_birth} onChange={(event) => setFamilyForm((current) => ({ ...current, date_of_birth: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Phone
                <Input value={familyForm.phone} onChange={(event) => setFamilyForm((current) => ({ ...current, phone: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Email
                <Input type="email" value={familyForm.email} onChange={(event) => setFamilyForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                PHN
                <Input value={familyForm.phn} onChange={(event) => setFamilyForm((current) => ({ ...current, phn: event.target.value }))} />
              </label>
              <label className="grid gap-2 text-sm text-slate-700">
                Notes
                <Textarea value={familyForm.notes} onChange={(event) => setFamilyForm((current) => ({ ...current, notes: event.target.value }))} />
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
    </div>
  );
}
