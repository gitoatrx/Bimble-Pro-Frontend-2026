"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";

// ── Types & mock data ──────────────────────────────────────────────

type Appointment = {
  id: number;
  patientName: string;
  patientStatus: "active" | "inactive";
  service: string;
  status: string;
  doctor: string | null;
  time: string;
  dateKey: string; // "YYYY-MM-DD"
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function offsetKey(base: string, offset: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

const TODAY = todayKey();

const MOCK_ALL: Appointment[] = [
  { id: 1, patientName: "Sarah Chen",    patientStatus: "active",   service: "General Consultation", status: "COMPLETED",   doctor: "Dr. Patel", time: "9:00 AM",  dateKey: TODAY },
  { id: 2, patientName: "Marcus Brown",  patientStatus: "active",   service: "Prescription Renewal", status: "IN_PROGRESS", doctor: "Dr. Patel", time: "10:30 AM", dateKey: TODAY },
  { id: 3, patientName: "Rita Nguyen",   patientStatus: "active",   service: "Blood Work",           status: "QUEUED",      doctor: null,        time: "11:15 AM", dateKey: TODAY },
  { id: 4, patientName: "James Parker",  patientStatus: "active",   service: "Sick Note",            status: "ASSIGNED",    doctor: "Dr. Kim",   time: "2:00 PM",  dateKey: offsetKey(TODAY, 1) },
  { id: 5, patientName: "Lin Wei",       patientStatus: "active",   service: "Referral",             status: "QUEUED",      doctor: null,        time: "3:30 PM",  dateKey: offsetKey(TODAY, 1) },
  { id: 6, patientName: "Aisha Patel",   patientStatus: "inactive", service: "Mental Health",        status: "QUEUED",      doctor: null,        time: "10:00 AM", dateKey: offsetKey(TODAY, 2) },
  { id: 7, patientName: "Tom Nguyen",    patientStatus: "active",   service: "Immunization",         status: "ASSIGNED",    doctor: "Dr. Patel", time: "11:30 AM", dateKey: offsetKey(TODAY, 3) },
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

// ── 7-day calendar strip ───────────────────────────────────────────

function getDayKeys(anchorKey: string, count = 7): string[] {
  return Array.from({ length: count }, (_, i) => offsetKey(anchorKey, i));
}

function formatDayLabel(key: string): { weekday: string; day: string } {
  const d = new Date(key + "T00:00:00");
  return {
    weekday: d.toLocaleDateString("en-CA", { weekday: "short" }),
    day: d.getDate().toString(),
  };
}

function CalendarStrip({
  weekStart,
  selectedKey,
  appointmentsByDate,
  onSelect,
  onPrev,
  onNext,
}: {
  weekStart: string;
  selectedKey: string;
  appointmentsByDate: Map<string, Appointment[]>;
  onSelect: (key: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const days = getDayKeys(weekStart);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {new Date(weekStart + "T00:00:00").toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((key) => {
          const { weekday, day } = formatDayLabel(key);
          const isSelected = key === selectedKey;
          const isToday = key === TODAY;
          const count = appointmentsByDate.get(key)?.length ?? 0;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cn(
                "flex flex-col items-center rounded-xl py-2 px-1 transition-all",
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <span className={cn("text-[10px] font-medium uppercase tracking-wide", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {weekday}
              </span>
              <span className={cn("mt-1 text-sm font-bold", isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground")}>
                {day}
              </span>
              {count > 0 && (
                <span className={cn("mt-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold", isSelected ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function AppointmentsCalendarPage() {
  const [weekStart, setWeekStart] = useState(TODAY);
  const [selectedKey, setSelectedKey] = useState(TODAY);

  const appointmentsByDate = new Map<string, Appointment[]>();
  for (const appt of MOCK_ALL) {
    const existing = appointmentsByDate.get(appt.dateKey) ?? [];
    appointmentsByDate.set(appt.dateKey, [...existing, appt]);
  }

  const dayAppointments = appointmentsByDate.get(selectedKey) ?? [];

  const selectedLabel = new Date(selectedKey + "T00:00:00").toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Appointments
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Calendar
        </h1>
      </div>

      {/* 7-day strip */}
      <CalendarStrip
        weekStart={weekStart}
        selectedKey={selectedKey}
        appointmentsByDate={appointmentsByDate}
        onSelect={setSelectedKey}
        onPrev={() => { setWeekStart((k) => offsetKey(k, -7)); }}
        onNext={() => { setWeekStart((k) => offsetKey(k, 7)); }}
      />

      {/* Day list */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {selectedLabel}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {dayAppointments.length === 0 ? "No appointments" : `${dayAppointments.length} appointment${dayAppointments.length > 1 ? "s" : ""}`}
          </span>
        </h2>

        {dayAppointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">No appointments on this day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayAppointments.map((appt) => (
              <div
                key={appt.id}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex w-20 flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {appt.time}
                </div>

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

                <div className="hidden sm:flex w-32 flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="truncate">{appt.doctor ?? "Unassigned"}</span>
                </div>

                <div className="flex-shrink-0">
                  <StatusBadge status={appt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
