"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { formatCanadaPacificDateKey, getCanadaPacificDateKey } from "@/lib/time-zone";
import {
  createClinicAvailability,
  deleteClinicAvailability,
  fetchClinicAvailability,
  fetchClinicDoctors,
} from "@/lib/api/clinic-dashboard";

type Doctor = { id: number; name: string };

type Availability = {
  id: number;
  doctorId: number;
  mode: "recurring" | "specific";
  daysOfWeek: number[];
  specificDate?: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  effectiveFrom: string;
  effectiveUntil: string;
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function normalizeDoctor(record: Record<string, unknown>): Doctor {
  return {
    id: Number(record.id ?? record.doctor_id ?? Date.now()),
    name:
      (typeof record.name === "string" && record.name) ||
      (typeof record.doctor_name === "string" && record.doctor_name) ||
      "Unknown doctor",
  };
}

function normalizeAvailability(record: Record<string, unknown>): Availability {
  return {
    id: Number(record.id ?? record.availability_id ?? Date.now()),
    doctorId: Number(record.doctorId ?? record.doctor_id ?? record.doctor_id ?? 0),
    mode:
      (typeof record.mode === "string" && record.mode === "specific" ? "specific" : "recurring"),
    daysOfWeek: Array.isArray(record.daysOfWeek)
      ? (record.daysOfWeek as number[])
      : Array.isArray(record.days_of_week)
        ? (record.days_of_week as number[])
        : [],
    specificDate:
      (typeof record.specificDate === "string" && record.specificDate) ||
      (typeof record.specific_date === "string" && record.specific_date) ||
      undefined,
    startTime:
      (typeof record.startTime === "string" && record.startTime) ||
      (typeof record.start_time === "string" && record.start_time) ||
      "",
    endTime:
      (typeof record.endTime === "string" && record.endTime) ||
      (typeof record.end_time === "string" && record.end_time) ||
      "",
    breakStartTime:
      (typeof record.breakStartTime === "string" && record.breakStartTime) ||
      (typeof record.break_start_time === "string" && record.break_start_time) ||
      undefined,
    breakEndTime:
      (typeof record.breakEndTime === "string" && record.breakEndTime) ||
      (typeof record.break_end_time === "string" && record.break_end_time) ||
      undefined,
    effectiveFrom:
      (typeof record.effectiveFrom === "string" && record.effectiveFrom) ||
      (typeof record.effective_from === "string" && record.effective_from) ||
      getCanadaPacificDateKey(),
    effectiveUntil:
      (typeof record.effectiveUntil === "string" && record.effectiveUntil) ||
      (typeof record.effective_until === "string" && record.effective_until) ||
      "",
  };
}

function displayDate(value: string) {
  return formatCanadaPacificDateKey(value, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AddEntryForm({
  doctors,
  onAdd,
}: {
  doctors: Doctor[];
  onAdd: (entry: Omit<Availability, "id">) => Promise<void>;
}) {
  const [doctorId, setDoctorId] = useState<number>(doctors[0]?.id ?? 0);
  const [mode, setMode] = useState<"recurring" | "specific">("recurring");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [specificDate, setSpecificDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [breakStartTime, setBreakStartTime] = useState("12:00");
  const [breakEndTime, setBreakEndTime] = useState("13:00");
  const [effectiveFrom, setEffectiveFrom] = useState(getCanadaPacificDateKey());
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (doctors.length > 0 && !doctorId) {
      setDoctorId(doctors[0].id);
    }
  }, [doctorId, doctors]);

  function toggleDay(day: number) {
    setDaysOfWeek((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort(),
    );
  }

  function canSave() {
    if (!doctorId) return false;
    if (startTime >= endTime) return false;
    if ((breakStartTime && !breakEndTime) || (!breakStartTime && breakEndTime)) return false;
    if (breakStartTime && breakEndTime) {
      if (!(startTime < breakStartTime && breakStartTime < breakEndTime && breakEndTime < endTime)) {
        return false;
      }
    }
    if (mode === "recurring" && daysOfWeek.length === 0) return false;
    if (mode === "specific" && !specificDate) return false;
    return effectiveFrom !== "";
  }

  async function handleAdd() {
    if (!canSave()) return;

    setSaving(true);
    setError("");

    try {
      await onAdd({
        doctorId,
        mode,
        daysOfWeek: mode === "recurring" ? daysOfWeek : [],
        specificDate: mode === "specific" ? specificDate : undefined,
        startTime,
        endTime,
        breakStartTime: breakStartTime || undefined,
        breakEndTime: breakEndTime || undefined,
        effectiveFrom,
        effectiveUntil,
      });
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setSpecificDate("");
      setStartTime("09:00");
      setEndTime("17:00");
      setBreakStartTime("12:00");
      setBreakEndTime("13:00");
      setEffectiveUntil("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add availability.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Add availability</p>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Doctor
        </label>
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(Number(e.target.value))}
          className="h-12 w-full max-w-xs rounded-2xl border border-border bg-card px-4 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Schedule type
        </label>
        <div className="flex gap-2">
          {(["recurring", "specific"] as const).map((scheduleType) => (
            <button
              key={scheduleType}
              onClick={() => setMode(scheduleType)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-all",
                mode === scheduleType
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {scheduleType === "recurring" ? "Recurring (weekly)" : "Specific dates"}
            </button>
          ))}
        </div>
      </div>

      {mode === "recurring" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Days of week
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, index) => (
              <button
                key={label}
                onClick={() => toggleDay(index)}
                className={cn(
                  "h-9 w-12 rounded-lg border text-xs font-semibold transition-all",
                  daysOfWeek.includes(index)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === "specific" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Date
          </label>
          <Input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} className="max-w-xs" />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hours
        </label>
        <div className="flex max-w-xs items-center gap-2">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <span className="flex-shrink-0 text-sm text-muted-foreground">to</span>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        {startTime >= endTime && startTime && endTime && (
          <p className="mt-1 text-xs text-destructive">End time must be after start time.</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Lunch break
        </label>
        <div className="flex max-w-xs items-center gap-2">
          <Input type="time" value={breakStartTime} onChange={(e) => setBreakStartTime(e.target.value)} />
          <span className="flex-shrink-0 text-sm text-muted-foreground">to</span>
          <Input type="time" value={breakEndTime} onChange={(e) => setBreakEndTime(e.target.value)} />
        </div>
        {breakStartTime && breakEndTime && !(startTime < breakStartTime && breakStartTime < breakEndTime && breakEndTime < endTime) ? (
          <p className="mt-1 text-xs text-destructive">
            Lunch break must stay inside the doctor&apos;s working hours.
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            These times are excluded when 15-minute appointment slots are generated.
          </p>
        )}
      </div>

      {mode === "recurring" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Effective dates (optional)
          </label>
          <div className="flex max-w-sm items-center gap-2">
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            <span className="flex-shrink-0 text-sm text-muted-foreground">until</span>
            <Input
              type="date"
              value={effectiveUntil}
              onChange={(e) => setEffectiveUntil(e.target.value)}
              placeholder="No end date"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Leave end date empty for an indefinite schedule.</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button onClick={handleAdd} disabled={!canSave() || saving} size="sm">
        {saving ? "Adding…" : "Add availability"}
      </Button>
    </div>
  );
}

function EntryRow({
  entry,
  doctorName,
  onDelete,
}: {
  entry: Availability;
  doctorName: string;
  onDelete: (id: number) => Promise<void>;
}) {
  const dayNames = entry.daysOfWeek.map((day) => DAY_LABELS[day]).join(", ");
  const until = entry.effectiveUntil ? displayDate(entry.effectiveUntil) : "No end date";
  const lunch = entry.breakStartTime && entry.breakEndTime ? `${entry.breakStartTime} - ${entry.breakEndTime}` : null;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {doctorName.split(" ").pop()?.charAt(0) ?? "D"}
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{doctorName}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {entry.mode === "recurring" ? (
            <span className="text-xs text-muted-foreground">{dayNames}</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {entry.specificDate ? displayDate(entry.specificDate) : ""}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {entry.startTime} - {entry.endTime}
          </span>
          {lunch ? (
            <span className="text-xs text-muted-foreground">Lunch: {lunch}</span>
          ) : null}
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            From {displayDate(entry.effectiveFrom)} - {until}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDelete(entry.id)}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function DoctorSchedulePage() {
  const session = readClinicLoginSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [entries, setEntries] = useState<Availability[]>([]);
  const [filterDoctorId, setFilterDoctorId] = useState<number | "all">("all");
  const [filterMode, setFilterMode] = useState<"all" | "recurring" | "specific">("all");
  const [effectiveOn, setEffectiveOn] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    if (!session?.accessToken) {
      setLoading(false);
      setError("You are not logged in. Please sign in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [doctorRecords, availabilityRecords] = await Promise.all([
        fetchClinicDoctors(session.accessToken),
        fetchClinicAvailability(session.accessToken, {
          doctorId: filterDoctorId,
          mode: filterMode === "all" ? undefined : filterMode,
          effectiveOn: effectiveOn || undefined,
          from: from || undefined,
          to: to || undefined,
        }),
      ]);

      setDoctors((doctorRecords as Record<string, unknown>[]).map(normalizeDoctor));
      setEntries((availabilityRecords as Record<string, unknown>[]).map(normalizeAvailability));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load availability.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDoctorId, filterMode, effectiveOn, from, to, session?.accessToken]);

  async function handleAdd(entry: Omit<Availability, "id">) {
    if (!session?.accessToken) return;

    const payload = {
      doctorId: entry.doctorId,
      mode: entry.mode,
      daysOfWeek: entry.daysOfWeek,
      specificDate: entry.specificDate,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakStartTime: entry.breakStartTime,
      breakEndTime: entry.breakEndTime,
      effectiveFrom: entry.effectiveFrom,
      effectiveUntil: entry.effectiveUntil || undefined,
    };

    await createClinicAvailability(session.accessToken, payload);
    await loadData();
  }

  async function handleDelete(id: number) {
    if (!session?.accessToken) return;
    await deleteClinicAvailability(session.accessToken, id);
    await loadData();
  }

  const visibleEntries = useMemo(() => entries, [entries]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Team
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Doctor availability
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set when each doctor is available at this clinic. Schedules are specific to this clinic.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20">
          {error}
        </div>
      )}

      <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
        <select
          value={filterDoctorId}
          onChange={(e) => setFilterDoctorId(e.target.value === "all" ? "all" : Number(e.target.value))}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
        >
          <option value="all">All doctors</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.name}
            </option>
          ))}
        </select>
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as "all" | "recurring" | "specific")}
          className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-medium text-foreground focus:outline-none"
        >
          <option value="all">All modes</option>
          <option value="recurring">Recurring</option>
          <option value="specific">Specific</option>
        </select>
        <Input
          type="date"
          value={effectiveOn}
          onChange={(e) => setEffectiveOn(e.target.value)}
          className="h-9"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9"
            placeholder="From"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9"
            placeholder="To"
          />
        </div>
      </div>

      <div className="mb-8">
        <AddEntryForm doctors={doctors} onAdd={handleAdd} />
      </div>

      {loading && (
        <p className="mb-4 text-sm text-muted-foreground">Loading schedules...</p>
      )}

      {visibleEntries.length > 0 && (
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Current schedules
          </h2>
          <div className="space-y-2">
            {visibleEntries.map((entry) => {
              const doctor = doctors.find((item) => item.id === entry.doctorId);
              return (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  doctorName={doctor?.name ?? "Unknown Doctor"}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>
        </section>
      )}

      {!loading && visibleEntries.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No schedules match the current filters.
        </p>
      )}
    </div>
  );
}
