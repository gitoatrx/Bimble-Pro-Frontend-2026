"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Lock,
  MessageSquare,
  Printer,
  Rocket,
  Stethoscope,
  Tags,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchAvailableServices,
  fetchClinicServiceMappings,
  fetchClinicSetupState,
  saveClinicServiceMappings,
  saveEmailNotifications,
  saveFaxIntegration,
  saveTextMessageNotifications,
} from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { fetchDoctorInvites, inviteDoctor } from "@/lib/api/clinic";

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
  const [provider, setProvider] = useState<"twilio" | "auth0" | "swift" | "">("");
  const [fields, setFields] = useState({
    accountSid: "",
    authToken: "",
    fromNumber: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const session = readClinicLoginSession();

    if (!session?.accessToken) {
      return;
    }

    if (enabled === false) {
      onComplete();
      return;
    }

    setSaving(true);

    try {
      await saveTextMessageNotifications(session.accessToken, {
        enabled: true,
        provider_name: provider,
        account_identifier: fields.accountSid,
        auth_secret: fields.authToken,
        from_number: fields.fromNumber,
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
            <div className="flex flex-wrap gap-2">
              {(["twilio", "auth0", "swift"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                    provider === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {p === "twilio" ? "Twilio" : p === "auth0" ? "Auth0" : "Swift"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Account SID"
              value={fields.accountSid}
              onChange={(e) =>
                setFields((f) => ({ ...f, accountSid: e.target.value }))
              }
            />
            <Input
              type="password"
              placeholder="Auth Token"
              value={fields.authToken}
              onChange={(e) =>
                setFields((f) => ({ ...f, authToken: e.target.value }))
              }
            />
            <Input
              placeholder="From number (e.g. +16041234567)"
              value={fields.fromNumber}
              onChange={(e) =>
                setFields((f) => ({ ...f, fromNumber: e.target.value }))
              }
            />
          </div>
        </div>
      )}

      {enabled !== null && (
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving…" : enabled ? "Save & continue" : "Skip & continue"}
        </Button>
      )}
    </div>
  );
}

// ── Fax Step ──────────────────────────────────────────────────────

function FaxStep({ onComplete }: { onComplete: () => void }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<"SRFax" | "RingCentral Fax" | "">("");
  const [fields, setFields] = useState({
    accountIdentifier: "",
    authSecret: "",
    faxNumber: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function canSave() {
    if (enabled === false) return true;
    if (!provider) return false;
    return (
      fields.accountIdentifier.trim() !== "" &&
      fields.authSecret.trim() !== "" &&
      fields.faxNumber.trim() !== ""
    );
  }

  async function handleSave() {
    const session = readClinicLoginSession();

    if (!session?.accessToken) {
      return;
    }

    if (enabled === false) {
      onComplete();
      return;
    }

    setSaving(true);

    try {
      await saveFaxIntegration(session.accessToken, {
        enabled: true,
        provider_name: provider === "SRFax" ? "srfax" : "ringcentral",
        account_identifier: fields.accountIdentifier,
        auth_secret: fields.authSecret,
        fax_number: fields.faxNumber,
        notes: fields.notes.trim() ? fields.notes : null,
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
              {(["SRFax", "RingCentral Fax"] as const).map((p) => (
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
                  {p}
                </button>
              ))}
            </div>
          </div>

          {provider && (
            <div className="space-y-3">
              <Input
                placeholder="Account identifier"
                value={fields.accountIdentifier}
                onChange={(e) => setFields((f) => ({ ...f, accountIdentifier: e.target.value }))}
              />
              <Input
                type="password"
                placeholder="Auth secret"
                value={fields.authSecret}
                onChange={(e) => setFields((f) => ({ ...f, authSecret: e.target.value }))}
              />
              <Input
                placeholder="Fax number"
                value={fields.faxNumber}
                onChange={(e) => setFields((f) => ({ ...f, faxNumber: e.target.value }))}
              />
              <Input
                placeholder="Notes"
                value={fields.notes}
                onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))}
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
    host: "smtp.gmail.com",
    port: "587",
    username: "",
    password: "",
    senderName: "Bimble Clinic",
    senderEmail: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const session = readClinicLoginSession();

    if (!session?.accessToken) {
      return;
    }

    if (enabled === false) {
      onComplete();
      return;
    }

    setSaving(true);

    try {
      await saveEmailNotifications(session.accessToken, {
        enabled: true,
        smtp_host: fields.host,
        smtp_port: Number(fields.port) || 587,
        smtp_username: fields.username,
        smtp_password: fields.password,
        sender_name: fields.senderName,
        sender_email: fields.senderEmail,
      });
      onComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
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
              placeholder="SMTP host"
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
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving…" : enabled ? "Save & continue" : "Skip & continue"}
        </Button>
      )}
    </div>
  );
}

// ── Services Step ─────────────────────────────────────────────────

function ServicesStep({ onComplete }: { onComplete: () => void }) {
  const session = readClinicLoginSession();
  const accessToken = session?.accessToken ?? "";
  const [selected, setSelected] = useState<number[]>([]);
  const [services, setServices] = useState(MOCK_SERVICES);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState(
    accessToken ? "" : "You are not logged in. Please refresh and try again.",
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let active = true;

    Promise.all([
      fetchAvailableServices(),
      fetchClinicServiceMappings(accessToken),
    ])
      .then(([serviceCatalog, records]) => {
        if (!active) return;

        const available = (serviceCatalog as Record<string, unknown>[]).map((record) => ({
          id: Number(record.service_id ?? record.id ?? 0),
          service_name:
            (typeof record.service_name === "string" && record.service_name) ||
            (typeof record.name === "string" && record.name) ||
            `Service ${record.service_id ?? record.id ?? ""}`,
        }));

        const mappedIds = (records as Record<string, unknown>[]).map((record) =>
          Number(record.platform_service_id ?? record.service_id ?? record.id ?? 0),
        );

        setServices(available.filter((svc) => Number.isFinite(svc.id) && svc.id > 0));
        setSelected(mappedIds.filter((id) => Number.isFinite(id) && id > 0));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load services.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

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
    if (!accessToken || selected.length === 0) return;
    setSaving(true);

    try {
      await saveClinicServiceMappings(accessToken, selected);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save services.");
    } finally {
      setSaving(false);
    }
  }

  const selectedNames = services
    .filter((s) => selected.includes(s.id))
    .map((s) => s.service_name);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Select the services your clinic provides. Patients will only be matched with your clinic for the services you offer.
      </p>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div ref={dropdownRef} className="relative w-full max-w-sm">
        <button
          disabled={loading}
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
            {services.map((svc) => (
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
        disabled={selected.length === 0 || saving || loading}
        size="sm"
      >
        {saving ? "Saving…" : loading ? "Loading…" : "Save & continue"}
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
  onDoctorInvited: (email: string, status?: "pending" | "accepted") => void;
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
    const session = readClinicLoginSession();
    if (!session) {
      setError("You are not logged in. Please refresh and try again.");
      setSending(false);
      return;
    }
    try {
      await inviteDoctor(trimmed, session.accessToken);
      setSending(false);
      onDoctorInvited(trimmed);
      setEmail("");
    } catch (err) {
      setSending(false);
      const msg = err instanceof Error ? err.message : "";
      // Backend returns 409 when the doctor is already a member — treat as accepted
      if (
        msg.toLowerCase().includes("already a member") ||
        (err as { status?: number }).status === 409
      ) {
        onDoctorInvited(trimmed, "accepted");
        setEmail("");
        return;
      }
      setError(msg || "Failed to send invite. Please try again.");
    }
  }

  const hasAccepted = invitedDoctors.some((d) => d.status === "accepted");

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Invite a doctor by email. If they already have a Bimble account, they&apos;ll just need to accept. Otherwise, they&apos;ll receive an email to get set up.
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
  const { label, description } = step;
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
  const router = useRouter();
  const session = readClinicLoginSession();
  const [completedSteps, setCompletedSteps] = useState<Set<StepKey>>(new Set());
  const [invitedDoctors, setInvitedDoctors] = useState<
    { email: string; status: "pending" | "accepted" }[]
  >([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [loadingSetupState, setLoadingSetupState] = useState(Boolean(session?.accessToken));

  // Load setup state and existing invites on mount.
  useEffect(() => {
    if (!session?.accessToken) return;

    let active = true;

    Promise.all([
      fetchClinicSetupState(session.accessToken),
      fetchDoctorInvites(session.accessToken),
    ])
      .then(([setup, records]) => {
        if (!active) return;

        const setupRecord = setup as Record<string, unknown>;
        const setupStatus = typeof setupRecord.setup_status === "string"
          ? setupRecord.setup_status.toUpperCase()
          : typeof setupRecord.status === "string"
            ? setupRecord.status.toUpperCase()
            : "";
        const completionPercent = Number(
          setupRecord.completion_percent ?? setupRecord.completionPercent ?? 0,
        );
        const completedSteps = Number(
          setupRecord.completed_steps ?? setupRecord.completedSteps ?? 0,
        );
        const totalSteps = Number(setupRecord.total_steps ?? setupRecord.totalSteps ?? 0);
        const completed =
          setupRecord.setup_completed === true ||
          setupRecord.completed === true ||
          completionPercent >= 100 ||
          (completedSteps > 0 && totalSteps > 0 && completedSteps >= totalSteps) ||
          setupStatus === "COMPLETED" ||
          setupStatus === "DONE" ||
          setupStatus === "LIVE" ||
          setupStatus === "ACTIVE";

        setSetupComplete(completed);

        const onboardingSteps = Array.isArray(setupRecord.onboarding_steps)
          ? (setupRecord.onboarding_steps as Record<string, unknown>[])
          : [];
        const completedFromBackend = new Set<StepKey>();

        for (const step of onboardingSteps) {
          if (step.completed !== true) continue;
          const key = step.step_key;
          if (key === "text_message_notifications") completedFromBackend.add("sms");
          if (key === "fax_integration") completedFromBackend.add("fax");
          if (key === "email_notifications") completedFromBackend.add("email");
          if (key === "map_services") completedFromBackend.add("services");
          if (key === "doctor_invite") completedFromBackend.add("doctor_invite");
          if (key === "start_accepting_appointments") completedFromBackend.add("go_live");
        }

        if (completedFromBackend.size > 0) {
          setCompletedSteps(completedFromBackend);
        }

        const mapped = records.map((r) => ({
          email: r.email,
          status: (r.status === "ACCEPTED" ? "accepted" : "pending") as
            | "pending"
            | "accepted",
        }));
        if (mapped.length > 0) setInvitedDoctors(mapped);

        if (completed) {
          router.replace("/clinic/appointments/today");
        }
      })
      .catch(() => {
        // Non-fatal — local checklist can still render if backend status is unavailable.
      })
      .finally(() => {
        if (active) setLoadingSetupState(false);
      });

    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function markComplete(key: StepKey) {
    setCompletedSteps((s) => new Set([...s, key]));
  }

  function handleDoctorInvited(email: string, status: "pending" | "accepted" = "pending") {
    setInvitedDoctors((d) => {
      // Update existing entry if present, otherwise append
      const exists = d.find((x) => x.email === email);
      if (exists) {
        return d.map((x) => x.email === email ? { ...x, status } : x);
      }
      return [...d, { email, status }];
    });
  }

  function handleGoLive() {
    markComplete("go_live");
    // Signal layout to unlock all nav items
    localStorage.setItem("bimble:clinic:onboarding-complete", "true");
    window.dispatchEvent(new Event("bimble:clinic:onboarding-complete"));
    router.replace("/clinic/appointments/today");
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

  if (loadingSetupState) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Checking setup status...</p>
      </div>
    );
  }

  if (setupComplete) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Clinic setup
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          {`Welcome, ${session?.clinicSlug ?? "Clinic"}`}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Complete these steps to start accepting appointments from Bimble patients.
        </p>

        {/* Progress bar */}
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
