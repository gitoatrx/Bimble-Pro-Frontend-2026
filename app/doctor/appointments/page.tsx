"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import {
  formatCanadaPacificDateKey,
  getCanadaPacificDateKey,
  shiftCanadaPacificDateKey,
} from "@/lib/time-zone";
import { fetchDoctorAppointments, type DoctorAppointment } from "@/lib/api/doctor-dashboard";

function todayKey() {
  return getCanadaPacificDateKey();
}

function offsetKey(base: string, n: number) {
  return shiftCanadaPacificDateKey(base, n);
}

const TODAY = todayKey();

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ASSIGNED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  QUEUED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  NO_SHOW: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function DoctorAppointmentsPage() {
  const [weekStart, setWeekStart] = useState(TODAY);
  const [selectedKey, setSelectedKey] = useState(TODAY);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => offsetKey(weekStart, index)), [weekStart]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = readDoctorLoginSession();
      if (!session?.accessToken) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const from = weekStart;
        const to = offsetKey(weekStart, 6);
        const response = await fetchDoctorAppointments(session.accessToken, { from, to });
        if (!cancelled) {
          setAppointments(response.appointments ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setAppointments([]);
          setError(err instanceof Error ? err.message : "Failed to load appointments.");
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
  }, [weekStart]);

  const byDate = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>();
    for (const appointment of appointments) {
      map.set(appointment.date_key, [...(map.get(appointment.date_key) ?? []), appointment]);
    }
    return map;
  }, [appointments]);

  const dayAppts = byDate.get(selectedKey) ?? [];

  return (
    <DoctorPageShell eyebrow="Schedule" title="Appointments">
      <DoctorSection title="Week view">
        <div className="rounded-[1.5rem] border border-border/70 bg-background p-3.5">
          <div className="mb-3.5 flex items-center justify-between gap-3">
            <button
              onClick={() => setWeekStart((current) => offsetKey(current, -7))}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-lg font-semibold text-foreground">
              {formatCanadaPacificDateKey(weekStart, {
                month: "long",
                year: "numeric",
              })}
            </p>
            <button
              onClick={() => setWeekStart((current) => offsetKey(current, 7))}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((key) => {
              const weekday = formatCanadaPacificDateKey(key, { weekday: "short" });
              const day = formatCanadaPacificDateKey(key, { day: "numeric" });
              const count = byDate.get(key)?.length ?? 0;
              const isSelected = key === selectedKey;
              const isToday = key === TODAY;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={cn(
                    "flex flex-col items-center rounded-2xl border px-2 py-2.5 text-center transition-all",
                    isSelected
                      ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                      : "border-border/70 bg-card hover:border-primary/20 hover:bg-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-[0.18em]",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {weekday}
                  </span>
                  <span
                    className={cn(
                      "mt-1 font-display text-lg font-semibold",
                      isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground",
                    )}
                  >
                    {day}
                  </span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "mt-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                        isSelected ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary",
                      )}
                    >
                      {count}
                    </span>
                  ) : (
                    <span className="mt-2 h-5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DoctorSection>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DoctorSection title="Day">
          {loading ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Loading appointments…</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          ) : dayAppts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Free day</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayAppts.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 transition-all hover:border-primary/30 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                      {appointment.patient_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{appointment.patient_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {appointment.user_friendly_service_name || appointment.service_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start">
                    <span className="inline-flex items-center rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {appointment.time}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        STATUS_COLORS[appointment.status] ?? "bg-muted text-muted-foreground",
                      )}
                    >
                      {appointmentLabel(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DoctorSection>
      </div>
    </DoctorPageShell>
  );
}
