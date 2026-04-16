"use client";

import React, { useState } from "react";
import { CalendarDays, Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

type RosterEntry = {
  id: number;
  doctorId: number;
  mode: "recurring" | "specific";
  daysOfWeek: number[];   // for recurring: 0=Sun…6=Sat
  specificDate?: string;  // for specific: "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  effectiveFrom: string;
  effectiveUntil: string; // "" = indefinite
};

type Doctor = { id: number; name: string };

const MOCK_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Priya Patel"  },
  { id: 2, name: "Dr. James Kim"    },
  { id: 3, name: "Dr. Sofia Mendes" },
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MOCK_ENTRIES: RosterEntry[] = [
  { id: 1, doctorId: 1, mode: "recurring", daysOfWeek: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "17:00", effectiveFrom: "2026-01-01", effectiveUntil: "" },
  { id: 2, doctorId: 2, mode: "recurring", daysOfWeek: [1, 3, 5],        startTime: "08:00", endTime: "14:00", effectiveFrom: "2026-01-01", effectiveUntil: "2026-12-31" },
];

// ── Add entry form ─────────────────────────────────────────────────

function AddEntryForm({
  doctors,
  onAdd,
}: {
  doctors: Doctor[];
  onAdd: (entry: Omit<RosterEntry, "id">) => void;
}) {
  const [doctorId, setDoctorId] = useState<number>(doctors[0]?.id ?? 0);
  const [mode, setMode] = useState<"recurring" | "specific">("recurring");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [specificDate, setSpecificDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split("T")[0]);
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleDay(d: number) {
    setDaysOfWeek((days) => days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());
  }

  function canSave() {
    if (!doctorId) return false;
    if (startTime >= endTime) return false;
    if (mode === "recurring" && daysOfWeek.length === 0) return false;
    if (mode === "specific" && !specificDate) return false;
    return effectiveFrom !== "";
  }

  async function handleAdd() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    onAdd({
      doctorId,
      mode,
      daysOfWeek: mode === "recurring" ? daysOfWeek : [],
      specificDate: mode === "specific" ? specificDate : undefined,
      startTime,
      endTime,
      effectiveFrom,
      effectiveUntil,
    });
    // Reset
    setDaysOfWeek([1, 2, 3, 4, 5]);
    setSpecificDate("");
    setStartTime("09:00");
    setEndTime("17:00");
    setEffectiveUntil("");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Add availability</p>
      </div>

      {/* Doctor */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Doctor
        </label>
        <select
          value={doctorId}
          onChange={(e) => setDoctorId(Number(e.target.value))}
          className="h-12 w-full max-w-xs rounded-2xl border border-border bg-card px-4 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Mode */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Schedule type
        </label>
        <div className="flex gap-2">
          {(["recurring", "specific"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium capitalize transition-all",
                mode === m
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {m === "recurring" ? "Recurring (weekly)" : "Specific dates"}
            </button>
          ))}
        </div>
      </div>

      {/* Days */}
      {mode === "recurring" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Days of week
          </label>
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, idx) => (
              <button
                key={idx}
                onClick={() => toggleDay(idx)}
                className={cn(
                  "h-9 w-12 rounded-lg border text-xs font-semibold transition-all",
                  daysOfWeek.includes(idx)
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
          <Input
            type="date"
            value={specificDate}
            onChange={(e) => setSpecificDate(e.target.value)}
            className="max-w-xs"
          />
        </div>
      )}

      {/* Times */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Hours
        </label>
        <div className="flex items-center gap-2 max-w-xs">
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <span className="text-sm text-muted-foreground flex-shrink-0">to</span>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
        {startTime >= endTime && startTime && endTime && (
          <p className="mt-1 text-xs text-destructive">End time must be after start time.</p>
        )}
      </div>

      {/* Effective range */}
      {mode === "recurring" && (
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Effective dates (optional)
          </label>
          <div className="flex items-center gap-2 max-w-sm">
            <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            <span className="text-sm text-muted-foreground flex-shrink-0">until</span>
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

      <Button onClick={handleAdd} disabled={!canSave() || saving} size="sm">
        {saving ? "Adding…" : "Add availability"}
      </Button>
    </div>
  );
}

// ── Entry row ──────────────────────────────────────────────────────

function EntryRow({
  entry,
  doctorName,
  onDelete,
}: {
  entry: RosterEntry;
  doctorName: string;
  onDelete: (id: number) => void;
}) {
  const dayNames = entry.daysOfWeek.map((d) => DAY_LABELS[d]).join(", ");
  const until = entry.effectiveUntil
    ? new Date(entry.effectiveUntil + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })
    : "No end date";

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {doctorName.split(" ").pop()?.charAt(0) ?? "D"}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{doctorName}</p>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          {entry.mode === "recurring" ? (
            <span className="text-xs text-muted-foreground">{dayNames}</span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {entry.specificDate
                ? new Date(entry.specificDate + "T00:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
                : ""}
            </span>
          )}

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {entry.startTime} – {entry.endTime}
          </span>

          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            From {new Date(entry.effectiveFrom + "T00:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })} · {until}
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

// ── Page ───────────────────────────────────────────────────────────

export default function DoctorSchedulePage() {
  const [entries, setEntries] = useState<RosterEntry[]>(MOCK_ENTRIES);
  const [filterDoctorId, setFilterDoctorId] = useState<number | "all">("all");

  function handleAdd(entry: Omit<RosterEntry, "id">) {
    setEntries((e) => [...e, { ...entry, id: Date.now() }]);
  }

  function handleDelete(id: number) {
    setEntries((e) => e.filter((x) => x.id !== id));
  }

  const visible = filterDoctorId === "all"
    ? entries
    : entries.filter((e) => e.doctorId === filterDoctorId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Team
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Doctor availability
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set when each doctor is available at this clinic. Schedules are specific to this clinic — the same doctor can have different hours elsewhere.
        </p>
      </div>

      {/* Add form */}
      <div className="mb-8">
        <AddEntryForm doctors={MOCK_DOCTORS} onAdd={handleAdd} />
      </div>

      {/* Filter + list */}
      {entries.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Current schedules
            </h2>
            <select
              value={filterDoctorId}
              onChange={(e) => setFilterDoctorId(e.target.value === "all" ? "all" : Number(e.target.value))}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none"
            >
              <option value="all">All doctors</option>
              {MOCK_DOCTORS.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {visible.map((entry) => {
              const doc = MOCK_DOCTORS.find((d) => d.id === entry.doctorId);
              return (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  doctorName={doc?.name ?? "Unknown Doctor"}
                  onDelete={handleDelete}
                />
              );
            })}
          </div>

          {visible.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No schedules for this doctor yet.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
