"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";

type Appointment = {
  id: number;
  patientName: string;
  service: string;
  status: string;
  time: string;
  dateKey: string;
};

function todayKey() { return new Date().toISOString().split("T")[0]; }
function offsetKey(base: string, n: number) {
  const d = new Date(base + "T00:00:00"); d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
const TODAY = todayKey();

const MOCK: Appointment[] = [
  { id: 1, patientName: "Sarah Chen",   service: "General Consultation", status: "COMPLETED",   time: "9:00 AM",  dateKey: TODAY },
  { id: 2, patientName: "Marcus Brown", service: "Prescription Renewal", status: "IN_PROGRESS", time: "10:30 AM", dateKey: TODAY },
  { id: 3, patientName: "James Parker", service: "Sick Note",            status: "ASSIGNED",    time: "2:00 PM",  dateKey: offsetKey(TODAY, 1) },
  { id: 4, patientName: "Lin Wei",      service: "Referral",             status: "QUEUED",      time: "3:30 PM",  dateKey: offsetKey(TODAY, 1) },
  { id: 5, patientName: "Tom Nguyen",   service: "Immunization",         status: "ASSIGNED",    time: "11:30 AM", dateKey: offsetKey(TODAY, 3) },
];

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  ASSIGNED:    "bg-violet-100 text-violet-700",
  QUEUED:      "bg-amber-100 text-amber-700",
  COMPLETED:   "bg-green-100 text-green-700",
  NO_SHOW:     "bg-rose-100 text-rose-700",
  CANCELLED:   "bg-slate-100 text-slate-500",
};

export default function DoctorAppointmentsPage() {
  const [weekStart, setWeekStart] = useState(TODAY);
  const [selectedKey, setSelectedKey] = useState(TODAY);

  const byDate = new Map<string, Appointment[]>();
  for (const a of MOCK) {
    byDate.set(a.dateKey, [...(byDate.get(a.dateKey) ?? []), a]);
  }

  const days = Array.from({ length: 7 }, (_, i) => offsetKey(weekStart, i));
  const dayAppts = byDate.get(selectedKey) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Schedule</p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">Appointments</h1>
      </div>

      {/* 7-day strip */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setWeekStart((k) => offsetKey(k, -7))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">
            {new Date(weekStart + "T00:00:00").toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
          </span>
          <button onClick={() => setWeekStart((k) => offsetKey(k, 7))} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((key) => {
            const d = new Date(key + "T00:00:00");
            const count = byDate.get(key)?.length ?? 0;
            const isSel = key === selectedKey;
            return (
              <button key={key} onClick={() => setSelectedKey(key)}
                className={cn("flex flex-col items-center rounded-xl py-2 px-1 transition-all", isSel ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
                <span className={cn("text-[10px] font-medium uppercase", isSel ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {d.toLocaleDateString("en-CA", { weekday: "short" })}
                </span>
                <span className={cn("mt-1 text-sm font-bold", isSel ? "text-primary-foreground" : key === TODAY ? "text-primary" : "text-foreground")}>
                  {d.getDate()}
                </span>
                {count > 0 && (
                  <span className={cn("mt-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold", isSel ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary")}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {new Date(selectedKey + "T00:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}
          <span className="ml-2 text-xs font-normal text-muted-foreground">{dayAppts.length === 0 ? "No appointments" : `${dayAppts.length} appointment${dayAppts.length > 1 ? "s" : ""}`}</span>
        </h2>

        {dayAppts.length === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-12">
            <p className="text-sm text-muted-foreground">Free day.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayAppts.map((a) => (
              <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex w-20 items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="h-3.5 w-3.5" />{a.time}
                </div>
                <div className="flex flex-1 items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 rounded-full bg-primary/10 items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                    {a.patientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{a.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.service}</p>
                  </div>
                </div>
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium flex-shrink-0", STATUS_COLORS[a.status] ?? "bg-muted text-muted-foreground")}>
                  {appointmentLabel(a.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
