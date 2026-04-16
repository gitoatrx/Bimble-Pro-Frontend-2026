"use client";

import React from "react";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import { readDoctorLoginSession } from "@/lib/doctor/session";

type Appointment = {
  id: number;
  patientName: string;
  service: string;
  status: string;
  time: string;
};

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ASSIGNED:    "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  QUEUED:      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  NO_SHOW:     "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  CANCELLED:   "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

const TODAY_QUEUE: Appointment[] = [
  { id: 1, patientName: "Sarah Chen",   service: "General Consultation", status: "IN_PROGRESS", time: "9:00 AM"  },
  { id: 2, patientName: "Marcus Brown", service: "Prescription Renewal", status: "ASSIGNED",    time: "10:30 AM" },
  { id: 3, patientName: "Rita Nguyen",  service: "Blood Work",           status: "ASSIGNED",    time: "11:15 AM" },
];

export default function DoctorDashboardPage() {
  const session = readDoctorLoginSession();
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric",
  });

  const active   = TODAY_QUEUE.filter((a) => a.status === "IN_PROGRESS" || a.status === "ASSIGNED");
  const finished = TODAY_QUEUE.filter((a) => a.status === "COMPLETED" || a.status === "CANCELLED" || a.status === "NO_SHOW");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {session?.clinicName}
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Today&apos;s Queue
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{today}</p>
      </div>

      {/* Stats row */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "Assigned", value: active.length, color: "text-violet-600" },
          { label: "In consultation", value: TODAY_QUEUE.filter((a) => a.status === "IN_PROGRESS").length, color: "text-blue-600" },
          { label: "Seen today", value: finished.length, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <p className={cn("font-display text-2xl font-bold", color)}>{value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Up next</h2>
          <div className="space-y-2">
            {active.map((a) => (
              <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:bg-accent/30 transition-colors">
                <div className="flex w-20 flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />{a.time}
                </div>
                <div className="flex flex-1 items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {a.patientName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{a.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">{a.service}</p>
                  </div>
                </div>
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[a.status])}>
                  {appointmentLabel(a.status)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {active.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <p className="text-sm font-medium text-foreground">No patients in your queue</p>
          <p className="mt-1 text-xs text-muted-foreground">Check the Pool tab to claim available appointments.</p>
        </div>
      )}
    </div>
  );
}
