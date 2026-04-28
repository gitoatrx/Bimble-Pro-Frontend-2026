"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import {
  assignClinicAppointmentDoctor,
  fetchClinicAppointmentsByDate,
  fetchClinicAppointmentsByRange,
  fetchClinicDoctors,
} from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";

type Appointment = {
  id: number;
  patientName: string;
  patientStatus: "active" | "inactive";
  service: string;
  status: string;
  doctor: string | null;
  assignedDoctorId: number | null;
  time: string;
  dateKey: string;
};

type ClinicDoctorOption = {
  id: number;
  name: string;
};

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function offsetKey(base: string, offset: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

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
    doctor:
      (typeof record.doctor === "string" && record.doctor) ||
      (typeof record.assigned_doctor === "string" && record.assigned_doctor) ||
      (typeof record.doctor_name === "string" && record.doctor_name) ||
      null,
    assignedDoctorId:
      typeof record.assigned_doctor_id === "number"
        ? record.assigned_doctor_id
        : typeof record.assigned_doctor_id === "string" && record.assigned_doctor_id
          ? Number(record.assigned_doctor_id)
          : null,
    time:
      (typeof record.time === "string" && record.time) ||
      (typeof record.start_time === "string" && record.start_time) ||
      "",
    dateKey:
      (typeof record.date === "string" && record.date) ||
      (typeof record.date_key === "string" && record.date_key) ||
      todayKey(),
  };
}

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
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
          {new Date(weekStart + "T00:00:00").toLocaleDateString("en-CA", {
            month: "long",
            year: "numeric",
          })}
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
          const isToday = key === todayKey();
          const count = appointmentsByDate.get(key)?.length ?? 0;

          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={cn(
                "flex flex-col items-center rounded-xl px-1 py-2 transition-all",
                isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                {weekday}
              </span>
              <span
                className={cn(
                  "mt-1 text-sm font-bold",
                  isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground",
                )}
              >
                {day}
              </span>
              {count > 0 && (
                <span
                  className={cn(
                    "mt-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                    isSelected ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
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

export default function AppointmentsCalendarPage() {
  const session = readClinicLoginSession();
  const accessToken = session?.accessToken ?? "";
  const hasSession = Boolean(session?.accessToken);
  const [doctors, setDoctors] = useState<ClinicDoctorOption[]>([]);
  const [weekStart, setWeekStart] = useState(todayKey());
  const [selectedKey, setSelectedKey] = useState(todayKey());
  const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
  const [dayAppointments, setDayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState(
    hasSession ? "" : "You are not logged in. Please sign in again.",
  );
  const [assignSelections, setAssignSelections] = useState<Record<number, string>>({});
  const [assignPendingId, setAssignPendingId] = useState<number | null>(null);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    let active = true;
    fetchClinicDoctors(accessToken)
      .then((records) => {
        if (!active) return;
        const items = Array.isArray(records) ? records : [];
        setDoctors(
          items
            .map((record) => {
              const idRaw = record.id ?? record.doctor_id;
              const nameRaw = record.name ?? record.doctor_name;
              const statusRaw = record.status;
              const id = typeof idRaw === "number" ? idRaw : Number(idRaw);
              const name = typeof nameRaw === "string" ? nameRaw : "";
              const status = typeof statusRaw === "string" ? statusRaw.toUpperCase() : "ACTIVE";
              if (!Number.isFinite(id) || !name || status !== "ACTIVE") {
                return null;
              }
              return { id, name };
            })
            .filter((value): value is ClinicDoctorOption => value !== null),
        );
      })
      .catch(() => {
        if (!active) return;
        setDoctors([]);
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasSession]);

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    let active = true;

      Promise.all([
        fetchClinicAppointmentsByRange(
        accessToken,
        weekStart,
        offsetKey(weekStart, 6),
      ),
      fetchClinicAppointmentsByDate(accessToken, selectedKey),
    ])
      .then(([weekRecords, dayRecords]) => {
        if (!active) return;

        const weekList = Array.isArray(weekRecords)
          ? weekRecords
          : (weekRecords as Record<string, unknown>).appointments ??
            (weekRecords as Record<string, unknown>).items ??
            (weekRecords as Record<string, unknown>).data ??
            [];
        const dayList = Array.isArray(dayRecords)
          ? dayRecords
          : (dayRecords as Record<string, unknown>).appointments ??
            (dayRecords as Record<string, unknown>).items ??
            (dayRecords as Record<string, unknown>).data ??
            [];

        setWeekAppointments((weekList as Record<string, unknown>[]).map(normalizeAppointment));
        setDayAppointments((dayList as Record<string, unknown>[]).map(normalizeAppointment));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load appointments.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasSession, selectedKey, weekStart]);

  async function handleAssignDoctor(appointmentId: number) {
    if (!accessToken) {
      setAssignError("You are not logged in. Please sign in again.");
      return;
    }
    const selectedDoctorId = Number(assignSelections[appointmentId] || "");
    if (!selectedDoctorId) {
      setAssignError("Select a doctor before assigning the appointment.");
      return;
    }

    setAssignPendingId(appointmentId);
    setAssignError("");
    setAssignSuccess("");
    try {
      const updated = normalizeAppointment(
        await assignClinicAppointmentDoctor(accessToken, appointmentId, selectedDoctorId),
      );
      setWeekAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? updated : appointment,
        ),
      );
      setDayAppointments((current) =>
        current.map((appointment) =>
          appointment.id === appointmentId ? updated : appointment,
        ),
      );
      setAssignSuccess("Appointment assigned successfully.");
    } catch (err) {
      setAssignError(
        err instanceof Error ? err.message : "Could not assign doctor.",
      );
    } finally {
      setAssignPendingId((current) => (current === appointmentId ? null : current));
    }
  }

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();

    for (const appt of weekAppointments) {
      const existing = map.get(appt.dateKey) ?? [];
      map.set(appt.dateKey, [...existing, appt]);
    }

    return map;
  }, [weekAppointments]);

  const selectedLabel = new Date(selectedKey + "T00:00:00").toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Appointments
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Calendar
        </h1>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20">
          {error}
        </div>
      )}
      {assignError && (
        <div className="mb-5 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {assignError}
        </div>
      )}
      {assignSuccess && (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
          {assignSuccess}
        </div>
      )}

      <CalendarStrip
        weekStart={weekStart}
        selectedKey={selectedKey}
        appointmentsByDate={appointmentsByDate}
        onSelect={(key) => {
          setLoading(true);
          setSelectedKey(key);
        }}
        onPrev={() => {
          setLoading(true);
          setWeekStart((k) => offsetKey(k, -7));
        }}
        onNext={() => {
          setLoading(true);
          setWeekStart((k) => offsetKey(k, 7));
        }}
      />

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          {selectedLabel}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {loading
              ? "Loading..."
              : dayAppointments.length === 0
                ? "No appointments"
                : `${dayAppointments.length} appointment${dayAppointments.length > 1 ? "s" : ""}`}
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
                className="rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-center gap-4">
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
                </div>

                {!appt.assignedDoctorId && appt.status === "ASSIGNED" ? (
                  <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Assign doctor
                      </label>
                      <select
                        value={assignSelections[appt.id] ?? ""}
                        onChange={(event) =>
                          setAssignSelections((current) => ({
                            ...current,
                            [appt.id]: event.target.value,
                          }))
                        }
                        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">Select a doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAssignDoctor(appt.id)}
                      disabled={assignPendingId === appt.id}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {assignPendingId === appt.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Assign
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
