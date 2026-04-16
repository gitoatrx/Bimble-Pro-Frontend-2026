"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Lock,
  MessageSquare,
  Phone,
  Printer,
  Rocket,
  Stethoscope,
  Tags,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { readClinicLoginSession } from "@/lib/clinic/session";

// ── Types ─────────────────────────────────────────────────────────

type StepKey =
  | "sms"
  | "fax"
  | "email"
  | "services"
  | "doctor_invite"
  | "go_live";

type StepStatus = "complete" | "active" | "pending" | "locked";

type ChecklistStep = {
  key: StepKey;
  label: string;
  description: string;
  Icon: React.FC<{ className?: string }>;
};

const STEPS: ChecklistStep[] = [
  {
    key: "sms",
    label: "Text Message Notifications",
    description: "Send appointment reminders and updates to patients via SMS.",
    Icon: MessageSquare,
  },
  {
    key: "fax",
    label: "Fax Integration",
    description: "Send referrals and documents directly from Bimble.",
    Icon: Printer,
  },
  {
    key: "email",
    label: "Email Notifications",
    description: "Send appointment confirmations and follow-ups by email.",
    Icon: Mail,
  },
  {
    key: "services",
    label: "Map Your Services",
    description: "Select the services your clinic offers to receive matching appointments.",
    Icon: Tags,
  },
  {
    key: "doctor_invite",
    label: "Invite Your First Doctor",
    description: "Invite a doctor to join your clinic. They'll receive an email to set up their account.",
    Icon: Stethoscope,
  },
  {
    key: "go_live",
    label: "Start Accepting Appointments",
    description: "Go live and start receiving pool appointments from patients.",
    Icon: Rocket,
  },
];

// ── Mock service list (will come from GET /api/v1/services) ───────

const MOCK_SERVICES = [
  { id: 1, service_name: "General Consultation" },
  { id: 2, service_name: "Blood Work" },
  { id: 3, service_name: "Prescription Renewal" },
  { id: 4, service_name: "Mental Health Assessment" },
  { id: 5, service_name: "Chronic Disease Management" },
  { id: 6, service_name: "Sick Note" },
  { id: 7, service_name: "Referral" },
  { id: 8, service_name: "Immunization" },
];

// ── Step indicator ────────────────────────────────────────────────

function StepIndicator({ status }: { status: StepStatus }) {
  if (status === "complete") {
    return <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />;
  }
  if (status === "active") {
    return <Circle className="h-5 w-5 text-primary flex-shrink-0 fill-primary/20" />;
  }
  if (status === "locked") {
    return <Lock className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />;
  }
  return <Circle className="h-5 w-5 text-border flex-shrink-0" />;
}

// ── SMS Step ──────────────────────────────────────────────────────

function SmsStep({ onComplete }: { onComplete: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<"twilio" | "auth" | "swift" | "">("");
  const [fields, setFields] = useState({ accountSid: "", authToken: "", fromNumber: "" });
  const [saving, setSaving] = useState(false);

  function canSave() {
    if (enabled === false) return true;
    if (!provider) return false;
    return fields.accountSid.trim() !== "" && fields.authToken.trim() !== "" && fields.fromNumber.trim() !== "";
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // replace with real API call
    setSaving(false);
    onComplete();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Would you like to send text message notifications to patients?
      </p>

      <div className="flex gap-3">
        {[{ v: true, label: "Yes, enable SMS" }, { v: false, label: "Skip for now" }].map(({ v, label }) => (
          <button
            key={String(v)}
            onClick={() => setEnabled(v)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              enabled === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {enabled === true && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Provider
            </label>
            <div className="flex gap-2">
              {(["twilio", "auth", "swift"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-all",
                    provider === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {p === "auth" ? "Auth.0" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {provider && (
            <div className="space-y-3">
              <Input
                placeholder={provider === "twilio" ? "Account SID" : "API Key"}
                value={fields.accountSid}
                onChange={(e) => setFields((f) => ({ ...f, accountSid: e.target.value }))}
              />
              <Input
                type="password"
                placeholder={provider === "twilio" ? "Auth Token" : "Secret"}
                value={fields.authToken}
                onChange={(e) => setFields((f) => ({ ...f, authToken: e.target.value }))}
              />
              <Input
                placeholder="From number (e.g. +16041234567)"
                value={fields.fromNumber}
                onChange={(e) => setFields((f) => ({ ...f, fromNumber: e.target.value }))}
              />
            </div>
          )}
        </div>
      )}

      {enabled !== null && (
        <Button onClick={handleSave} disabled={!canSave() || saving} size="sm">
          {saving ? "Saving…" : enabled ? "Save & continue" : "Skip & continue"}
        </Button>
      )}
    </div>
  );
}

// ── Fax Step ──────────────────────────────────────────────────────

function FaxStep({ onComplete }: { onComplete: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<"srfax" | "ringcentral" | "">("");
  const [fields, setFields] = useState({ accountId: "", password: "", faxNumber: "" });
  const [saving, setSaving] = useState(false);

  function canSave() {
    if (enabled === false) return true;
    if (!provider) return false;
    return fields.accountId.trim() !== "" && fields.password.trim() !== "";
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onComplete();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Would you like to integrate fax for sending referrals and documents?
      </p>

      <div className="flex gap-3">
        {[{ v: true, label: "Yes, enable fax" }, { v: false, label: "Skip for now" }].map(({ v, label }) => (
          <button
            key={String(v)}
            onClick={() => setEnabled(v)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              enabled === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {enabled === true && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Provider
            </label>
            <div className="flex gap-2">
              {(["srfax", "ringcentral"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                    provider === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {p === "srfax" ? "SRFax" : "RingCentral Fax"}
                </button>
              ))}
            </div>
          </div>

          {provider && (
            <div className="space-y-3">
              <Input
                placeholder={provider === "srfax" ? "Account number" : "Client ID"}
                value={fields.accountId}
                onChange={(e) => setFields((f) => ({ ...f, accountId: e.target.value }))}
              />
              <Input
                type="password"
                placeholder={provider === "srfax" ? "Password" : "Client secret"}
                value={fields.password}
                onChange={(e) => setFields((f) => ({ ...f, password: e.target.value }))}
              />
              <Input
                placeholder="Fax number (e.g. +16041234567)"
                value={fields.faxNumber}
                onChange={(e) => setFields((f) => ({ ...f, faxNumber: e.target.value }))}
              />
            </div>
          )}
        </div>
      )}

      {enabled !== null && (
        <Button onClick={handleSave} disabled={!canSave() || saving} size="sm">
          {saving ? "Saving…" : enabled ? "Save & continue" : "Skip & continue"}
        </Button>
      )}
    </div>
  );
}

// ── Email / SMTP Step ─────────────────────────────────────────────

function EmailStep({ onComplete }: { onComplete: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [fields, setFields] = useState({
    host: "", port: "587", username: "", password: "", senderName: "", senderEmail: "",
  });
  const [saving, setSaving] = useState(false);

  function canSave() {
    if (enabled === false) return true;
    return (
      fields.host.trim() !== "" &&
      fields.username.trim() !== "" &&
      fields.password.trim() !== "" &&
      fields.senderEmail.trim() !== ""
    );
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onComplete();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Would you like to send email notifications to patients?
      </p>

      <div className="flex gap-3">
        {[{ v: true, label: "Yes, enable email" }, { v: false, label: "Skip for now" }].map(({ v, label }) => (
          <button
            key={String(v)}
            onClick={() => setEnabled(v)}
            className={cn(
              "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              enabled === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/40",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {enabled === true && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <Input
              className="flex-1"
              placeholder="SMTP host (e.g. smtp.gmail.com)"
              value={fields.host}
              onChange={(e) => setFields((f) => ({ ...f, host: e.target.value }))}
            />
            <Input
              className="w-24"
              placeholder="Port"
              value={fields.port}
              onChange={(e) => setFields((f) => ({ ...f, port: e.target.value }))}
            />
          </div>
          <Input
            placeholder="SMTP username / email"
            value={fields.username}
            onChange={(e) => setFields((f) => ({ ...f, username: e.target.value }))}
          />
          <Input
            type="password"
            placeholder="SMTP password"
            value={fields.password}
            onChange={(e) => setFields((f) => ({ ...f, password: e.target.value }))}
          />
          <Input
            placeholder="Sender name (e.g. Bimble Clinic)"
            value={fields.senderName}
            onChange={(e) => setFields((f) => ({ ...f, senderName: e.target.value }))}
          />
          <Input
            placeholder="Sender email (e.g. no-reply@yourclinic.com)"
            value={fields.senderEmail}
            onChange={(e) => setFields((f) => ({ ...f, senderEmail: e.target.value }))}
          />
        </div>
      )}

      {enabled !== null && (
        <Button onClick={handleSave} disabled={!canSave() || saving} size="sm">
          {saving ? "Saving…" : enabled ? "Save & continue" : "Skip & continue"}
        </Button>
      )}
    </div>
  );
}

// ── Services Step ─────────────────────────────────────────────────

function ServicesStep({ onComplete }: { onComplete: () => void }) {
  const [selected, setSelected] = useState<number[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function toggle(id: number) {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }

  async function handleSave() {
    if (selected.length === 0) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    onComplete();
  }

  const selectedNames = MOCK_SERVICES
    .filter((s) => selected.includes(s.id))
    .map((s) => s.service_name);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Select the services your clinic provides. Patients will only be matched with your clinic for the services you offer.
      </p>

      <div ref={dropdownRef} className="relative w-full max-w-sm">
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm transition-all",
            open ? "border-primary ring-2 ring-primary/20" : "border-border",
          )}
        >
          <span className={selected.length === 0 ? "text-muted-foreground" : "text-foreground"}>
            {selected.length === 0
              ? "Select services…"
              : `${selected.length} service${selected.length > 1 ? "s" : ""} selected`}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-20 mt-1.5 w-full rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
            {MOCK_SERVICES.map((svc) => (
              <button
                key={svc.id}
                onClick={() => toggle(svc.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all",
                    selected.includes(svc.id)
                      ? "border-primary bg-primary"
                      : "border-border",
                  )}
                >
                  {selected.includes(svc.id) && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={selected.includes(svc.id) ? "text-foreground" : "text-muted-foreground"}>
                  {svc.service_name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedNames.map((name) => (
            <span
              key={name}
              className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={selected.length === 0 || saving}
        size="sm"
      >
        {saving ? "Saving…" : "Save & continue"}
      </Button>
    </div>
  );
}

// ── Doctor Invite Step ────────────────────────────────────────────

function DoctorInviteStep({
  onComplete,
  invitedDoctors,
  onDoctorInvited,
}: {
  onComplete: () => void;
  invitedDoctors: { email: string; status: "pending" | "accepted" }[];
  onDoctorInvited: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleInvite() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    setError("");
    await new Promise((r) => setTimeout(r, 700));
    setSending(false);
    onDoctorInvited(trimmed);
    setEmail("");
  }

  const hasAccepted = invitedDoctors.some((d) => d.status === "accepted");

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Invite a doctor by email. If they already have a Bimble account, they'll just need to accept. Otherwise, they'll receive an email to get set up.
      </p>

      <div className="flex gap-2 max-w-sm">
        <Input
          type="email"
          placeholder="doctor@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          className={error ? "!border-destructive" : ""}
        />
        <Button onClick={handleInvite} disabled={sending || !email.trim()} size="sm" className="shrink-0">
          {sending ? "Sending…" : "Invite"}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {invitedDoctors.length > 0 && (
        <div className="space-y-2">
          {invitedDoctors.map(({ email: e, status }) => (
            <div
              key={e}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5"
            >
              <span className="flex-1 text-sm text-foreground">{e}</span>
              {status === "accepted" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <CheckCircle2 className="h-3 w-3" /> Joined
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Clock className="h-3 w-3" /> Invite sent
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {invitedDoctors.length > 0 && !hasAccepted && (
        <p className="text-xs text-muted-foreground">
          Waiting for a doctor to accept their invite before you can go live.
        </p>
      )}

      {hasAccepted && (
        <Button onClick={onComplete} size="sm">
          Continue
        </Button>
      )}
    </div>
  );
}

// ── Go Live Step ──────────────────────────────────────────────────

function GoLiveStep({
  canGoLive,
  blockingReasons,
  onGoLive,
}: {
  canGoLive: boolean;
  blockingReasons: string[];
  onGoLive: () => void;
}) {
  const [going, setGoing] = useState(false);

  async function handleGoLive() {
    setGoing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setGoing(false);
    onGoLive();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Once you go live, your clinic will start appearing in the patient pool. Doctors can claim appointments and your clinic will be fully active on Bimble.
      </p>

      {!canGoLive && blockingReasons.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
            Complete these before going live
          </p>
          {blockingReasons.map((r) => (
            <p key={r} className="flex items-center gap-2 text-sm text-amber-700">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
              {r}
            </p>
          ))}
        </div>
      )}

      <Button
        onClick={handleGoLive}
        disabled={!canGoLive || going}
        className="gap-2"
      >
        <Rocket className="h-4 w-4" />
        {going ? "Going live…" : "Start accepting appointments"}
      </Button>
    </div>
  );
}

// ── Checklist Item Wrapper ─────────────────────────────────────────

function ChecklistItem({
  step,
  status,
  children,
}: {
  step: ChecklistStep;
  status: StepStatus;
  children?: React.ReactNode;
}) {
  const { Icon, label, description } = step;
  const isOpen = status === "active";

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all",
        status === "complete" && "border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900",
        status === "active" && "border-primary/30 bg-card shadow-sm",
        status === "pending" && "border-border bg-card",
        status === "locked" && "border-border bg-muted/30 opacity-50",
      )}
    >
      <div className="flex items-start gap-4 p-5">
        <StepIndicator status={status} />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold",
              status === "complete" && "line-through text-muted-foreground",
              status === "active" && "text-foreground",
              status === "pending" && "text-foreground",
              status === "locked" && "text-muted-foreground",
            )}
          >
            {label}
          </p>
          {status !== "complete" && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}

          {isOpen && children && (
            <div className="mt-5">{children}</div>
          )}
        </div>

        {status === "complete" && (
          <span className="text-xs font-medium text-green-600 flex-shrink-0">Done</span>
        )}
        {status === "locked" && (
          <Lock className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function ClinicDashboardPage() {
  const session = readClinicLoginSession();
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());
  const [invitedDoctors, setInvitedDoctors] = useState<
    { email: string; status: "pending" | "accepted" }[]
  >([]);

  function markComplete(key: StepKey) {
    setCompletedSteps((s) => new Set([...s, key]));
  }

  function handleDoctorInvited(email: string) {
    setInvitedDoctors((d) => [...d, { email, status: "pending" }]);
  }

  function handleGoLive() {
    markComplete("go_live");
    // Signal layout to unlock all nav items
    localStorage.setItem("bimble:clinic:onboarding-complete", "true");
    window.dispatchEvent(new Event("bimble:clinic:onboarding-complete"));
  }

  // Determine the active step (first incomplete non-locked step)
  const stepOrder: StepKey[] = ["sms", "fax", "email", "services", "doctor_invite", "go_live"];

  function getStatus(key: StepKey): StepStatus {
    if (completedSteps.has(key)) return "complete";

    const idx = stepOrder.indexOf(key);
    const allPreviousComplete = stepOrder
      .slice(0, idx)
      .every((k) => completedSteps.has(k));

    if (!allPreviousComplete) return "locked";

    // Go live: also needs services and an accepted doctor
    if (key === "go_live") {
      const servicesOk = completedSteps.has("services");
      const doctorOk = invitedDoctors.some((d) => d.status === "accepted");
      if (!servicesOk || !doctorOk) return "locked";
    }

    return "active";
  }

  // Go live blocking reasons
  const goLiveBlockingReasons: string[] = [];
  if (!completedSteps.has("services")) {
    goLiveBlockingReasons.push("Map your services first");
  }
  if (!invitedDoctors.some((d) => d.status === "accepted")) {
    if (invitedDoctors.length === 0) {
      goLiveBlockingReasons.push("Invite at least one doctor");
    } else {
      const pendingEmails = invitedDoctors
        .filter((d) => d.status === "pending")
        .map((d) => d.email);
      goLiveBlockingReasons.push(
        `Waiting for ${pendingEmails.join(", ")} to accept their invite`,
      );
    }
  }

  const allDone = completedSteps.has("go_live");

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Clinic setup
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          {allDone ? "You're live! 🎉" : `Welcome, ${session?.clinicSlug ?? "Clinic"}`}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {allDone
            ? "Your clinic is now live and accepting appointments from the pool."
            : "Complete these steps to start accepting appointments from Bimble patients."}
        </p>

        {/* Progress bar */}
        {!allDone && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {completedSteps.size} of {stepOrder.length} steps complete
              </span>
              <span className="text-xs font-semibold text-primary">
                {Math.round((completedSteps.size / stepOrder.length) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedSteps.size / stepOrder.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {STEPS.map((step) => {
          const status = getStatus(step.key);

          return (
            <ChecklistItem key={step.key} step={step} status={status}>
              {step.key === "sms" && (
                <SmsStep onComplete={() => markComplete("sms")} />
              )}
              {step.key === "fax" && (
                <FaxStep onComplete={() => markComplete("fax")} />
              )}
              {step.key === "email" && (
                <EmailStep onComplete={() => markComplete("email")} />
              )}
              {step.key === "services" && (
                <ServicesStep onComplete={() => markComplete("services")} />
              )}
              {step.key === "doctor_invite" && (
                <DoctorInviteStep
                  onComplete={() => markComplete("doctor_invite")}
                  invitedDoctors={invitedDoctors}
                  onDoctorInvited={handleDoctorInvited}
                />
              )}
              {step.key === "go_live" && (
                <GoLiveStep
                  canGoLive={goLiveBlockingReasons.length === 0}
                  blockingReasons={goLiveBlockingReasons}
                  onGoLive={handleGoLive}
                />
              )}
            </ChecklistItem>
          );
        })}
      </div>
    </div>
  );
}
