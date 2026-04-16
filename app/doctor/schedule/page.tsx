"use client";

import React from "react";
import { CalendarDays, Clock } from "lucide-react";

type ScheduleEntry = {
  id: number;
  mode: "recurring" | "specific";
  days: string;
  startTime: string;
  endTime: string;
  note: string;
};

const MOCK_SCHEDULE: ScheduleEntry[] = [
  { id: 1, mode: "recurring", days: "Mon, Tue, Wed, Thu, Fri", startTime: "09:00", endTime: "17:00", note: "Standard hours" },
  { id: 2, mode: "specific",  days: "Apr 18, 2026 (Saturday)", startTime: "10:00", endTime: "14:00", note: "On-call shift" },
];

export default function DoctorSchedulePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Schedule</p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">My Availability</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your clinic has set the following hours for you. To request changes, contact your clinic admin.
        </p>
      </div>

      {MOCK_SCHEDULE.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <CalendarDays className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">No schedule set yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Your clinic hasn&apos;t set your availability yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {MOCK_SCHEDULE.map((entry) => (
            <div key={entry.id} className="rounded-2xl border border-border bg-card px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">{entry.days}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {entry.startTime} – {entry.endTime}
                  </p>
                  {entry.note && (
                    <p className="text-xs text-muted-foreground">{entry.note}</p>
                  )}
                </div>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground">
                  {entry.mode}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
