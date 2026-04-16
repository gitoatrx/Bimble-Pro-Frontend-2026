"use client";

import React, { useState } from "react";
import { CalendarCheck2, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";

// ── Mock data (replace with real API call) ─────────────────────────

type Appointment = {
  id: number;
  patientName: string;
  patientStatus: "active" | "inactive";
  service: string;
  status: string;
  doctor: string | null;
  time: string;
};

const MOCK_TODAY: Appointment[] = [
  { id: 1, patientName: "Sarah Chen",    patientStatus: "active",   service: "General Consultation", status: "IN_PROGRESS", doctor: "Dr. Patel",   time: "9:00 AM" },
  { id: 2, patientName: "Marcus Brown",  patientStatus: "active",   service: "Prescription Renewal", status: "ASSIGNED",    doctor: "Dr. Patel",   time: "10:30 AM" },
  { id: 3, patientName: "Rita Nguyen",   patientStatus: "active",   service: "Blood Work",           status: "QUEUED",      doctor: null,          time: "11:15 AM" },
  { id: 4, patientName: "John Moore",    patientStatus: "inactive", service: "Sick Note",            status: "COMPLETED",   doctor: "Dr. Kim",     time: "8:00 AM" },
  { id: 5, patientName: "Aisha Patel",   patientStatus: "active",   service: "Referral",             status: "NO_SHOW",     doctor: "Dr. Kim",     time: "9:45 AM" },
  { id: 6, patientName: "David Wilson",  patientStatus: "active",   service: "Immunization",         status: "CANCELLED",   doctor: null,          time: "2:00 PM" },
];

// ── Status badge ───────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ASSIGNED:    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  QUEUED:      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  NO_SHOW:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  CANCELLED:   "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  ESCALATED:   "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[status] ?? "bg-muted text-muted-foreground")}>
      {appointmentLabel(status)}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function TodayAppointmentsPage() {
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const active = MOCK_TODAY.filter((a) => !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status));
  const done   = MOCK_TODAY.filter((a) =>  ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(a.status));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Today&apos;s appointments
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
            {today}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.length} active · {done.length} done
          </p>
        </div>
      </div>

      {/* Active */}
      {active.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Active
          </h2>
          <div className="space-y-2">
            {active.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        </section>
      )}

      {/* Done */}
      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Finished
          </h2>
          <div className="space-y-2 opacity-60">
            {done.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        </section>
      )}

      {MOCK_TODAY.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <CalendarCheck2 className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No appointments today</p>
          <p className="mt-1 text-xs text-muted-foreground">Appointments will appear here once they&apos;re booked.</p>
        </div>
      )}
    </div>
  );
}

function AppointmentRow({ appt }: { appt: Appointment }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30">
      {/* Time */}
      <div className="flex w-20 flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {appt.time}
      </div>

      {/* Patient */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
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

      {/* Doctor */}
      <div className="hidden sm:flex w-32 flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <User className="h-3.5 w-3.5" />
        <span className="truncate">{appt.doctor ?? "Unassigned"}</span>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <StatusBadge status={appt.status} />
      </div>
    </div>
  );
}
