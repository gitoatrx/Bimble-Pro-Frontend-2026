"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import { fetchClinicToday, type AppointmentFollowUp } from "@/lib/api/clinic-dashboard";
import { formatPatientDetails, shouldShowPatientDetails } from "@/lib/appointment-details";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { formatCanadaPacificDateKey, getCanadaPacificDateKey } from "@/lib/time-zone";
import { useRealtimeRefresh } from "@/lib/realtime";

type Appointment = {
  id: number;
  patientName: string;
  patientStatus: "active" | "inactive";
  patientAge: number | null;
  patientGender: string | null;
  patientSex: string | null;
  patientDateOfBirth: string | null;
  phoneNumber: string | null;
  email: string | null;
  visitType: string | null;
  phn: string | null;
  service: string;
  chiefComplaint: string;
  status: string;
  hasPrescription: boolean;
  doctor: string | null;
  time: string;
  followUp: AppointmentFollowUp | null;
};

type ClinicTodayCounts = {
  total: number;
  queued: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
};

function normalizeAppointment(record: Record<string, unknown>): Appointment {
  const patient =
    record.patient && typeof record.patient === "object"
      ? (record.patient as Record<string, unknown>)
      : null;

  const firstString = (...values: Array<unknown>) =>
    values.find((value) => typeof value === "string" && value.trim()) as string | undefined;

  return {
    id: Number(record.id ?? record.appointment_id ?? Date.now()),
    patientName:
      (typeof record.patient_name === "string" && record.patient_name) ||
      firstString(patient?.name, patient?.first_name, patient?.full_name) ||
      (typeof record.patientName === "string" && record.patientName) ||
      "Unknown patient",
    patientStatus:
      typeof record.patient_status === "string" && record.patient_status.toLowerCase() === "inactive"
        ? "inactive"
        : "active",
    patientAge:
      typeof record.patient_age === "number"
        ? record.patient_age
        : typeof record.patient_age === "string" && record.patient_age
          ? Number(record.patient_age)
          : typeof patient?.age === "number"
            ? (patient.age as number)
            : typeof patient?.age === "string" && patient.age
              ? Number(patient.age)
          : null,
    patientGender:
      (typeof record.patient_gender === "string" && record.patient_gender) ||
      (typeof record.gender === "string" && record.gender) ||
      firstString(patient?.gender, patient?.sex) ||
      null,
    patientSex:
      (typeof record.patient_sex === "string" && record.patient_sex) ||
      firstString(patient?.sex) ||
      null,
    patientDateOfBirth:
      (typeof record.patient_date_of_birth === "string" && record.patient_date_of_birth) ||
      (typeof record.formatted_date_of_birth === "string" && record.formatted_date_of_birth) ||
      (typeof record.dob_label === "string" && record.dob_label) ||
      firstString(patient?.formatted_date_of_birth, patient?.date_of_birth_label, patient?.dob_label, patient?.dob) ||
      null,
    phoneNumber:
      (typeof record.phone_number === "string" && record.phone_number) ||
      (typeof record.patient_phone_number === "string" && record.patient_phone_number) ||
      firstString(patient?.phone, patient?.phone_number, patient?.telephone_number) ||
      null,
    email:
      (typeof record.email === "string" && record.email) ||
      (typeof record.patient_email === "string" && record.patient_email) ||
      firstString(patient?.email, patient?.email_address) ||
      null,
    visitType:
      (typeof record.visit_type === "string" && record.visit_type) ||
      firstString(patient?.visit_type) ||
      null,
    phn:
      (typeof record.phn === "string" && record.phn) ||
      (typeof record.health_number === "string" && record.health_number) ||
      (typeof record.medical_record_number === "string" && record.medical_record_number) ||
      firstString(patient?.phn, patient?.health_number, patient?.medical_record_number) ||
      null,
    service:
      (typeof record.service === "string" && record.service) ||
      (typeof record.service_name === "string" && record.service_name) ||
      "Appointment",
    chiefComplaint:
      (typeof record.chief_complaint === "string" && record.chief_complaint) ||
      "",
    status:
      (typeof record.status === "string" && record.status) ||
      (typeof record.appointment_status === "string" && record.appointment_status) ||
      "QUEUED",
    hasPrescription:
      record.has_prescription === true ||
      record.rx_written === true ||
      Number(record.prescription_count ?? 0) > 0 ||
      record.clinical_status === "RX_WRITTEN",
    doctor:
      (typeof record.doctor === "string" && record.doctor) ||
      (typeof record.assigned_doctor === "string" && record.assigned_doctor) ||
      (typeof record.doctor_name === "string" && record.doctor_name) ||
      null,
    time:
      (typeof record.time === "string" && record.time) ||
      (typeof record.start_time === "string" && record.start_time) ||
      "",
    followUp:
      record.follow_up && typeof record.follow_up === "object"
        ? (record.follow_up as AppointmentFollowUp)
        : null,
  };
}

function normalizeCounts(record: Record<string, unknown>): ClinicTodayCounts {
  return {
    total: Number(record.total ?? 0),
    queued: Number(record.queued ?? 0),
    assigned: Number(record.assigned ?? 0),
    in_progress: Number(record.in_progress ?? 0),
    completed: Number(record.completed ?? 0),
    cancelled: Number(record.cancelled ?? 0),
  };
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  RX_WRITTEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ASSIGNED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  QUEUED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  NO_SHOW: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  ESCALATED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_COLORS[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {appointmentLabel(status)}
    </span>
  );
}

function FollowUpPanel({ followUp }: { followUp: AppointmentFollowUp }) {
  return (
    <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Patient follow-up</p>
      {followUp.status === "SKIPPED" ? (
        <p className="mt-2 text-sm text-slate-600">Patient skipped the optional follow-up questions.</p>
      ) : (
        <div className="mt-2 grid gap-2">
          {followUp.answers.map((item) => (
            <div key={`${item.id}-${item.question}`} className="text-sm">
              <span className="font-medium text-slate-900">{item.question}</span>
              <span className="text-slate-600"> {item.answer}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appt }: { appt: Appointment }) {
  const [showFollowUp, setShowFollowUp] = useState(false);
  const showPatientDetails = shouldShowPatientDetails(appt.status);
  const patientDetails = formatPatientDetails(appt, { labelIdentifiers: true });

  return (
    <div>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {appt.patientName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{appt.patientName}</p>
            <p className="truncate text-xs text-muted-foreground">{appt.chiefComplaint}</p>
            {showPatientDetails && patientDetails.length > 0 ? (
              <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                {patientDetails.map((detail) => (
                  <span key={detail}>{detail}</span>
                ))}
              </div>
            ) : null}
          </div>
          {appt.patientStatus === "inactive" && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              Inactive
            </span>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-1.5">
          <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            <User className="h-3.5 w-3.5" />
            <span className="truncate">{appt.doctor ?? "Unassigned"}</span>
          </div>
          {appt.status !== "ASSIGNED" ? (
            <StatusBadge status={appt.status} />
          ) : null}
          {appt.followUp ? (
            <button
              type="button"
              onClick={() => setShowFollowUp((current) => !current)}
              className="inline-flex items-center rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
            >
              {showFollowUp ? "Hide follow-up" : "View follow-up"}
            </button>
          ) : null}
        </div>
      </div>
      {appt.followUp && showFollowUp ? <FollowUpPanel followUp={appt.followUp} /> : null}
      {appt.hasPrescription ? (
        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          {appointmentLabel("RX_WRITTEN")}
        </span>
      ) : null}
    </div>
  );
}

export default function TodayAppointmentsPage() {
  const session = readClinicLoginSession();
  const accessToken = session?.accessToken ?? "";
  const hasSession = Boolean(session?.accessToken);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [counts, setCounts] = useState<ClinicTodayCounts>({
    total: 0,
    queued: 0,
    assigned: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState(
    hasSession ? "" : "You are not logged in. Please sign in again.",
  );

  const loadToday = useCallback(async () => {
    if (!hasSession) return;
    const data = await fetchClinicToday(accessToken);
    const record = data as Record<string, unknown>;
    const list = Array.isArray(record)
      ? record
      : (record.appointments ?? record.items ?? record.data ?? []);
    setAppointments((list as Record<string, unknown>[]).map(normalizeAppointment));
  }, [accessToken, hasSession]);

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    let active = true;

    fetchClinicToday(accessToken)
      .then((data) => {
        if (!active) return;
        const record = data as Record<string, unknown>;
        const list = Array.isArray(record)
          ? record
          : (record.appointments ?? record.items ?? record.data ?? []);
        const normalizedAppointments = (list as Record<string, unknown>[]).map(normalizeAppointment);
        const countsRecord = record.counts && typeof record.counts === "object"
          ? (record.counts as Record<string, unknown>)
          : null;
        setAppointments(normalizedAppointments);
        if (countsRecord) {
          setCounts(normalizeCounts(countsRecord));
        } else {
          setCounts({
            total: normalizedAppointments.length,
            queued: normalizedAppointments.filter((appt) => appt.status === "QUEUED").length,
            assigned: normalizedAppointments.filter((appt) => appt.status === "ASSIGNED").length,
            in_progress: normalizedAppointments.filter((appt) => appt.status === "IN_PROGRESS").length,
            completed: normalizedAppointments.filter((appt) => appt.status === "COMPLETED").length,
            cancelled: normalizedAppointments.filter((appt) => appt.status === "CANCELLED").length,
          });
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load today's appointments.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasSession]);

  useRealtimeRefresh(loadToday, {
    enabled: hasSession,
    paths: ["/appointments", "/pool", "/requests", "/prescriptions"],
  });

  const today = formatCanadaPacificDateKey(getCanadaPacificDateKey(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const activeAppointments = useMemo(
    () => appointments.filter((appt) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appt.status)),
    [appointments],
  );
  const finishedAppointments = useMemo(
    () => appointments.filter((appt) => ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(appt.status)),
    [appointments],
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Today&apos;s appointments
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
            {today}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? "Loading..."
              : `${activeAppointments.length} active · ${finishedAppointments.length} done`}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: counts.total },
          { label: "Waiting", value: counts.queued },
          { label: "Assigned", value: counts.assigned },
          { label: "In progress", value: counts.in_progress },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{item.label}</p>
            <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {activeAppointments.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Active
          </h2>
          <div className="space-y-2">
            {activeAppointments.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        </section>
      )}

      {finishedAppointments.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Finished
          </h2>
          <div className="space-y-2 opacity-60">
            {finishedAppointments.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        </section>
      )}

      {!loading && appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <CalendarCheck2 className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No appointments today</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Appointments will appear here once they&apos;re booked.
          </p>
        </div>
      )}
    </div>
  );
}
