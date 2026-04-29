"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Check,
  CircleUserRound,
  Loader2,
  MapPin,
  MessageSquareText,
  MonitorSmartphone,
  X,
  Sparkles,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { readClinicLoginSession } from "@/lib/clinic/session";
import {
  acceptClinicPoolAppointment,
  fetchClinicPool,
  rejectClinicPoolAppointment,
  type ClinicPoolAppointment,
} from "@/lib/api/clinic-dashboard";
import { useRealtimeRefresh } from "@/lib/realtime";

function AppointmentTypeBadge({ type }: { type: "walkin" | "virtual" }) {
  const isVirtual = type === "virtual";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
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

function appointmentType(appointment: ClinicPoolAppointment): "walkin" | "virtual" {
  return appointment.visit_type === "virtual" ? "virtual" : "walkin";
}

function fulfillmentLabel(appointment: ClinicPoolAppointment) {
  if (appointment.fulfillment === "delivery") {
    return appointment.pharmacy_choice === "bimble"
      ? "Delivery · Bimble pharmacy"
      : "Delivery · Preferred pharmacy";
  }
  return null;
}

export default function ClinicPoolPage() {
  const [appointments, setAppointments] = useState<ClinicPoolAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [pendingId, setPendingId] = useState<number | null>(null);

  const loadPool = useCallback(async () => {
    const session = readClinicLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetchClinicPool(session.accessToken);
      setAppointments(response.appointments ?? []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clinic pool.");
    } finally {
      setLoading(false);
    }
  }, []);

  async function handlePoolAction(
    appointmentId: number,
    action: "accept" | "reject",
  ) {
    const session = readClinicLoginSession();
    if (!session?.accessToken) {
      setActionError("You are not logged in.");
      return;
    }

    setPendingId(appointmentId);
    setActionError("");
    setActionSuccess("");
    try {
      if (action === "accept") {
        await acceptClinicPoolAppointment(session.accessToken, appointmentId);
        setActionSuccess(
          "Appointment accepted. You can now assign it to a doctor from the clinic appointments page.",
        );
      } else {
        await rejectClinicPoolAppointment(session.accessToken, appointmentId);
        setActionSuccess("Appointment rejected.");
      }
      setAppointments((current) =>
        current.filter((appointment) => appointment.id !== appointmentId),
      );
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : `Failed to ${action} appointment.`,
      );
    } finally {
      setPendingId((current) => (current === appointmentId ? null : current));
    }
  }

  useEffect(() => {
    void loadPool();
  }, [loadPool]);

  useRealtimeRefresh(loadPool, {
    paths: ["/pool", "/appointments", "/patient-intake"],
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Clinic pool
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Available Appointments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only patients that match your clinic service mapping appear here.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Loading pool…</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <Sparkles className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Pool is empty right now</p>
          <p className="mt-1 text-xs text-muted-foreground">
            New patients that match your clinic services will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actionError ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}
          {actionSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
              {actionSuccess}
            </div>
          ) : null}
          {appointments.map((appointment) => {
            const fulfillment = fulfillmentLabel(appointment);
            const isPending = pendingId === appointment.id;
            return (
              <div
                key={appointment.id}
                className="rounded-2xl border border-border bg-card px-5 py-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{appointment.patient_name}</p>
                        <AppointmentTypeBadge type={appointmentType(appointment)} />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquareText className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">
                          {appointment.chief_complaint || appointment.user_friendly_service_name || appointment.service_name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {appointment.appointment_date || appointment.appointment_time ? (
                      <span>
                        {appointment.appointment_date} {appointment.appointment_time ? `· ${appointment.appointment_time}` : ""}
                      </span>
                    ) : null}
                    {appointment.care_location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {appointment.care_location}
                      </span>
                    ) : null}
                    {fulfillment ? (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {fulfillment}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => void handlePoolAction(appointment.id, "accept")}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePoolAction(appointment.id, "reject")}
                      disabled={isPending}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
