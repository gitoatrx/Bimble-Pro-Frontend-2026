"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ArrowRight, CircleUserRound, Loader2, MessageSquareText, MonitorSmartphone, Sparkles } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import {
  claimDoctorPoolAppointment,
  fetchDoctorPool,
  type DoctorAppointment,
} from "@/lib/api/doctor-dashboard";
import { useRealtimeRefresh } from "@/lib/realtime";

function AppointmentTypeBadge({ type }: { type: "walkin" | "virtual" }) {
  const isVirtual = type === "virtual";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
        isVirtual
          ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      )}
    >
      {isVirtual ? <MonitorSmartphone className="h-2.5 w-2.5" /> : <CircleUserRound className="h-2.5 w-2.5" />}
      {type}
    </span>
  );
}

function appointmentTypeFromRecord(appointment: DoctorAppointment): "walkin" | "virtual" {
  return appointment.visit_type === "virtual" ? "virtual" : "walkin";
}

export default function DoctorPoolPage() {
  const [pool, setPool] = useState<DoctorAppointment[]>([]);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimed, setClaimed] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPool = useCallback(async () => {
    const doctorSession = readDoctorLoginSession();
    if (!doctorSession?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetchDoctorPool(doctorSession.accessToken);
      setPool(response.appointments ?? []);
      setError("");
    } catch (err) {
      setPool([]);
      setError(err instanceof Error ? err.message : "Failed to load pool.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPool();
  }, [loadPool]);

  useRealtimeRefresh(loadPool, {
    paths: ["/pool", "/appointments", "/patient-intake"],
  });

  async function handleClaim(id: number) {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      return;
    }

    setClaiming(id);
    try {
      const response = await claimDoctorPoolAppointment(session.accessToken, id);
      setClaimed((current) => [...current, id]);
      setPool((current) =>
        current.map((appointment) =>
          appointment.appointment_id === id
            ? response.appointment
            : appointment,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not claim the appointment.");
    } finally {
      setClaiming(null);
    }
  }

  return (
    <DoctorPageShell eyebrow="Doctor pool" title="Pool">
      <DoctorSection title="Open queue">
        {claimed.length > 0 ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
            You claimed {claimed.length} appointment{claimed.length > 1 ? "s" : ""} this session.
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">Loading pool…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : pool.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">Pool is empty right now</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pool.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-border/70 bg-card px-3 py-3 transition-all hover:border-primary/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{appointment.patient_name}</p>
                      <AppointmentTypeBadge type={appointmentTypeFromRecord(appointment)} />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquareText className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">
                        {appointment.chief_complaint ?? ""}
                      </span>
                    </div>
                    {(appointment.appointment_date || appointment.appointment_time || appointment.fulfillment) ? (
                      <div className="text-xs text-muted-foreground">
                        {[appointment.appointment_date, appointment.appointment_time, appointment.fulfillment]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    ) : null}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleClaim(appointment.id)}
                    disabled={claiming !== null}
                    className="h-8 shrink-0 px-3 text-xs"
                  >
                    {claiming === appointment.id ? "Claiming..." : "Claim"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DoctorSection>
    </DoctorPageShell>
  );
}
