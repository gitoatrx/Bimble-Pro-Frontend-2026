"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import { fetchDoctorSchedule, type DoctorScheduleEntry } from "@/lib/api/doctor-dashboard";

export default function DoctorSchedulePage() {
  const [schedule, setSchedule] = useState<DoctorScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = readDoctorLoginSession();
      if (!session?.accessToken) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetchDoctorSchedule(session.accessToken);
        if (!cancelled) {
          setSchedule(response.schedule ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setSchedule([]);
          setError(err instanceof Error ? err.message : "Failed to load schedule.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DoctorPageShell eyebrow="Schedule" title="Schedule">
      <DoctorSection title="My availability">
        {loading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Loading schedule…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : schedule.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No schedule set yet</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {schedule.map((entry, index) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-border/70 bg-card px-3 py-3 transition-all hover:border-primary/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div
                      className={
                        index === 0
                          ? "flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary"
                          : "flex h-9 w-9 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
                      }
                    >
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{entry.days}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {entry.start_time} – {entry.end_time}
                      </p>
                      {entry.note ? <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p> : null}
                    </div>
                  </div>
                  <span className="inline-flex self-start rounded-full border border-border/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {entry.mode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DoctorSection>
    </DoctorPageShell>
  );
}
