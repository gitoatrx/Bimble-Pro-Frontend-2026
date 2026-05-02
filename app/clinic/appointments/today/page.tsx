"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import { fetchClinicToday } from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { formatCanadaPacificDateKey, getCanadaPacificDateKey } from "@/lib/time-zone";
import { useRealtimeRefresh } from "@/lib/realtime";

type Appointment = {
  id: number;
  patientName: string;
  patientStatus: "active" | "inactive";
  service: string;
  status: string;
  hasPrescription: boolean;
  doctor: string | null;
  time: string;
};

function normalizeAppointment(record: Record<string, unknown>): Appointment {
  return {
    id: Number(record.id ?? record.appointment_id ?? Date.now()),
    patientName:
      (typeof record.patient_name === "string" && record.patient_name) ||
      (typeof record.patientName === "string" && record.patientName) ||
      "Unknown patient",
    patientStatus:
      typeof record.patient_status === "string" && record.patient_status.toLowerCase() === "inactive"
        ? "inactive"
        : "active",
    service:
      (typeof record.service === "string" && record.service) ||
      (typeof record.service_name === "string" && record.service_name) ||
      "Appointment",
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

function AppointmentRow({ appt }: { appt: Appointment }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30">
      <div className="flex w-20 flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {appt.time}
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {appt.patientName.charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{appt.patientName}</p>
          <p className="truncate text-xs text-muted-foreground">{appt.service}</p>
        </div>
        {appt.patientStatus === "inactive" && (
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            Inactive
          </span>
        )}
      </div>

      <div className="hidden w-32 flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
        <User className="h-3.5 w-3.5" />
        <span className="truncate">{appt.doctor ?? "Unassigned"}</span>
      </div>

      <div className="flex-shrink-0">
        <StatusBadge status={appt.status} />
      </div>
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
        setAppointments((list as Record<string, unknown>[]).map(normalizeAppointment));
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

  const waitingCount = appointments.filter((appt) => appt.status === "QUEUED").length;
  const inProgressCount = appointments.filter((appt) => appt.status === "IN_PROGRESS").length;
  const completedCount = appointments.filter((appt) => appt.status === "COMPLETED").length;
  const urgentCount = appointments.filter((appt) => appt.status === "ESCALATED").length;

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
          { label: "Waiting", value: waitingCount },
          { label: "In progress", value: inProgressCount },
          { label: "Completed", value: completedCount },
          { label: "Urgent", value: urgentCount },
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
