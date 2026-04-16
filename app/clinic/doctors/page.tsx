"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, Mail, MoreVertical, Plus, Stethoscope, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { doctorStatusLabel } from "@/lib/doctor/types";

// ── Types & mock data ──────────────────────────────────────────────

type DoctorStatus = "ACTIVE" | "ON_LEAVE" | "INACTIVE";

type Doctor = {
  id: number;
  name: string;
  email: string;
  specialty: string;
  status: DoctorStatus;
};

type PendingInvite = {
  email: string;
  sentAt: string;
};

const MOCK_DOCTORS: Doctor[] = [
  { id: 1, name: "Dr. Priya Patel",  email: "ppatel@clinic.ca",  specialty: "Family Medicine",  status: "ACTIVE"   },
  { id: 2, name: "Dr. James Kim",    email: "jkim@clinic.ca",    specialty: "General Practice", status: "ACTIVE"   },
  { id: 3, name: "Dr. Sofia Mendes", email: "smendes@clinic.ca", specialty: "Internal Medicine",status: "ON_LEAVE" },
];

const MOCK_INVITES: PendingInvite[] = [
  { email: "new.doctor@email.com", sentAt: "Apr 14, 2026" },
];

const PLAN_SEATS = 5;

const STATUS_COLORS: Record<DoctorStatus, string> = {
  ACTIVE:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ON_LEAVE: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  INACTIVE: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

// ── Invite form ────────────────────────────────────────────────────

function InviteForm({ onInvite }: { onInvite: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    onInvite(trimmed);
    setEmail("");
    setSuccess(`Invite sent to ${trimmed}`);
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-5">
      <div className="mb-3 flex items-center gap-2">
        <Plus className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Invite a doctor</p>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        Enter their email address. If they already have a Bimble account, they&apos;ll just need to accept. Otherwise they&apos;ll receive an email to set up their account.
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="doctor@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          className={cn("max-w-xs", error && "!border-destructive")}
        />
        <Button onClick={handleInvite} disabled={sending || !email.trim()} size="sm">
          {sending ? "Sending…" : "Send invite"}
        </Button>
      </div>
      {error   && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600">{success}</p>}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(MOCK_DOCTORS);
  const [invites, setInvites] = useState<PendingInvite[]>(MOCK_INVITES);

  const activeCount = doctors.filter((d) => d.status === "ACTIVE").length;
  const seatsUsed = doctors.filter((d) => d.status !== "INACTIVE").length;

  function handleInvite(email: string) {
    setInvites((i) => [...i, { email, sentAt: new Date().toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" }) }]);
  }

  function handleDeactivate(id: number) {
    setDoctors((d) => d.map((doc) => doc.id === id ? { ...doc, status: "INACTIVE" } : doc));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Team
          </p>
          <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
            Doctors
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeCount} active · {seatsUsed} of {PLAN_SEATS} seats used
          </p>
        </div>
      </div>

      {/* Seat bar */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Seats used</span>
          <span className="font-semibold text-foreground">{seatsUsed} / {PLAN_SEATS}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", seatsUsed >= PLAN_SEATS ? "bg-rose-500" : "bg-primary")}
            style={{ width: `${(seatsUsed / PLAN_SEATS) * 100}%` }}
          />
        </div>
        {seatsUsed >= PLAN_SEATS && (
          <p className="mt-2 text-xs text-rose-600">
            You&apos;ve used all your seats. Upgrade your plan to add more doctors.
          </p>
        )}
      </div>

      {/* Active & On Leave doctors */}
      {doctors.filter((d) => d.status !== "INACTIVE").length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Active team
          </h2>
          <div className="space-y-2">
            {doctors.filter((d) => d.status !== "INACTIVE").map((doc) => (
              <DoctorRow key={doc.id} doctor={doc} onDeactivate={handleDeactivate} />
            ))}
          </div>
        </section>
      )}

      {/* Pending invites */}
      {invites.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pending invites
          </h2>
          <div className="space-y-2">
            {invites.map(({ email, sentAt }) => (
              <div key={email} className="flex items-center gap-4 rounded-2xl border border-dashed border-border bg-card px-5 py-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{email}</p>
                  <p className="text-xs text-muted-foreground">Invited {sentAt}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  <Clock className="h-3 w-3" /> Awaiting
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite form */}
      <InviteForm onInvite={handleInvite} />

      {/* Deactivated */}
      {doctors.filter((d) => d.status === "INACTIVE").length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Deactivated
          </h2>
          <div className="space-y-2 opacity-50">
            {doctors.filter((d) => d.status === "INACTIVE").map((doc) => (
              <DoctorRow key={doc.id} doctor={doc} onDeactivate={handleDeactivate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DoctorRow({ doctor, onDeactivate }: { doctor: Doctor; onDeactivate: (id: number) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-accent/30">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {doctor.name.split(" ").pop()?.charAt(0) ?? "D"}
      </div>

      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{doctor.name}</p>
        <p className="truncate text-xs text-muted-foreground">{doctor.specialty} · {doctor.email}</p>
      </div>

      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[doctor.status])}>
        {doctorStatusLabel(doctor.status)}
      </span>

      {doctor.status !== "INACTIVE" && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-xl border border-border bg-card shadow-lg p-1">
              <button
                onClick={() => { onDeactivate(doctor.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Deactivate
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
