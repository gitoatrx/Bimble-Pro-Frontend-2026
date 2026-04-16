"use client";

import React, { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Mail, MessageSquare, Printer, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Section wrapper ────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

// ── Save button with success flash ────────────────────────────────

function SaveButton({ onSave, label = "Save changes" }: { onSave: () => Promise<void>; label?: string }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handle() {
    setSaving(true);
    await onSave();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Button onClick={handle} disabled={saving} size="sm" className="gap-2">
      {saved ? <><Check className="h-3.5 w-3.5" /> Saved</> : saving ? "Saving…" : label}
    </Button>
  );
}

// ── SMS settings ───────────────────────────────────────────────────

function SmsSettings() {
  const [enabled, setEnabled] = useState(true);
  const [provider, setProvider] = useState<"twilio" | "auth" | "swift">("twilio");
  const [fields, setFields] = useState({ accountSid: "ACxxxx", authToken: "", fromNumber: "+16041234567" });

  return (
    <SettingsSection icon={MessageSquare} title="Text messages" description="SMS notifications to patients">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Enabled</label>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", enabled ? "bg-primary" : "bg-border")}
        >
          <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform", enabled ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </div>

      {enabled && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider</label>
            <div className="flex gap-2">
              {(["twilio", "auth", "swift"] as const).map((p) => (
                <button key={p} onClick={() => setProvider(p)}
                  className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-all",
                    provider === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40")}>
                  {p === "auth" ? "Auth.0" : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 max-w-sm">
            <Input placeholder="Account SID" value={fields.accountSid} onChange={(e) => setFields((f) => ({ ...f, accountSid: e.target.value }))} />
            <Input type="password" placeholder="Auth token" value={fields.authToken} onChange={(e) => setFields((f) => ({ ...f, authToken: e.target.value }))} />
            <Input placeholder="From number" value={fields.fromNumber} onChange={(e) => setFields((f) => ({ ...f, fromNumber: e.target.value }))} />
          </div>
        </>
      )}

      <SaveButton onSave={async () => { await new Promise((r) => setTimeout(r, 500)); }} />
    </SettingsSection>
  );
}

// ── Fax settings ───────────────────────────────────────────────────

function FaxSettings() {
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<"srfax" | "ringcentral">("srfax");
  const [fields, setFields] = useState({ accountId: "", password: "", faxNumber: "" });

  return (
    <SettingsSection icon={Printer} title="Fax" description="Send referrals and documents via fax">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Enabled</label>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", enabled ? "bg-primary" : "bg-border")}
        >
          <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform", enabled ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </div>

      {enabled && (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provider</label>
            <div className="flex gap-2">
              {(["srfax", "ringcentral"] as const).map((p) => (
                <button key={p} onClick={() => setProvider(p)}
                  className={cn("rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                    provider === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/40")}>
                  {p === "srfax" ? "SRFax" : "RingCentral Fax"}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 max-w-sm">
            <Input placeholder="Account number / Client ID" value={fields.accountId} onChange={(e) => setFields((f) => ({ ...f, accountId: e.target.value }))} />
            <Input type="password" placeholder="Password / Secret" value={fields.password} onChange={(e) => setFields((f) => ({ ...f, password: e.target.value }))} />
            <Input placeholder="Fax number" value={fields.faxNumber} onChange={(e) => setFields((f) => ({ ...f, faxNumber: e.target.value }))} />
          </div>
        </>
      )}

      <SaveButton onSave={async () => { await new Promise((r) => setTimeout(r, 500)); }} />
    </SettingsSection>
  );
}

// ── SMTP settings ──────────────────────────────────────────────────

function SmtpSettings() {
  const [enabled, setEnabled] = useState(true);
  const [fields, setFields] = useState({ host: "smtp.gmail.com", port: "587", username: "", password: "", senderName: "Bimble Clinic", senderEmail: "" });

  return (
    <SettingsSection icon={Mail} title="Email" description="Send appointment confirmations and reminders">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Enabled</label>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", enabled ? "bg-primary" : "bg-border")}
        >
          <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform", enabled ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </div>

      {enabled && (
        <div className="space-y-3 max-w-sm">
          <div className="flex gap-3">
            <Input className="flex-1" placeholder="SMTP host" value={fields.host} onChange={(e) => setFields((f) => ({ ...f, host: e.target.value }))} />
            <Input className="w-20" placeholder="Port" value={fields.port} onChange={(e) => setFields((f) => ({ ...f, port: e.target.value }))} />
          </div>
          <Input placeholder="SMTP username" value={fields.username} onChange={(e) => setFields((f) => ({ ...f, username: e.target.value }))} />
          <Input type="password" placeholder="SMTP password" value={fields.password} onChange={(e) => setFields((f) => ({ ...f, password: e.target.value }))} />
          <Input placeholder="Sender name" value={fields.senderName} onChange={(e) => setFields((f) => ({ ...f, senderName: e.target.value }))} />
          <Input placeholder="Sender email" value={fields.senderEmail} onChange={(e) => setFields((f) => ({ ...f, senderEmail: e.target.value }))} />
        </div>
      )}

      <SaveButton onSave={async () => { await new Promise((r) => setTimeout(r, 500)); }} />
    </SettingsSection>
  );
}

// ── Credentials ────────────────────────────────────────────────────

function CredentialsSettings() {
  const [fields, setFields] = useState({ currentPassword: "", newPassword: "", confirmPassword: "", pin: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  function canSave() {
    return (
      fields.currentPassword.trim() !== "" &&
      fields.newPassword.length >= 8 &&
      fields.newPassword === fields.confirmPassword
    );
  }

  return (
    <SettingsSection icon={KeyRound} title="Login credentials" description="Update your password and PIN">
      <div className="space-y-3 max-w-sm">
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Current password"
            value={fields.currentPassword}
            onChange={(e) => { setFields((f) => ({ ...f, currentPassword: e.target.value })); setError(""); }}
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Input
          type="password"
          placeholder="New password (min 8 characters)"
          value={fields.newPassword}
          onChange={(e) => { setFields((f) => ({ ...f, newPassword: e.target.value })); setError(""); }}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={fields.confirmPassword}
          onChange={(e) => { setFields((f) => ({ ...f, confirmPassword: e.target.value })); setError(""); }}
          className={fields.confirmPassword && fields.newPassword !== fields.confirmPassword ? "!border-destructive" : ""}
        />
        {fields.confirmPassword && fields.newPassword !== fields.confirmPassword && (
          <p className="text-xs text-destructive">Passwords don&apos;t match.</p>
        )}
        <Input
          type="password"
          placeholder="New PIN (4 digits, optional)"
          value={fields.pin}
          maxLength={4}
          onChange={(e) => setFields((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <SaveButton
        onSave={async () => {
          if (!canSave()) { setError("Please fill in all required fields correctly."); return; }
          await new Promise((r) => setTimeout(r, 600));
        }}
        label="Update credentials"
      />
    </SettingsSection>
  );
}

// ── Clinic profile ─────────────────────────────────────────────────

function ClinicProfileSettings() {
  const [fields, setFields] = useState({
    displayName: "Downtown Bimble Clinic",
    phone: "604 555 0142",
    email: "admin@bimbleclinic.ca",
    address: "123 Main St",
    city: "Vancouver",
    province: "BC",
  });

  return (
    <SettingsSection icon={User} title="Clinic profile" description="Your clinic&apos;s public-facing details">
      <div className="space-y-3 max-w-sm">
        <Input placeholder="Display name" value={fields.displayName} onChange={(e) => setFields((f) => ({ ...f, displayName: e.target.value }))} />
        <Input placeholder="Phone number" value={fields.phone} onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))} />
        <Input type="email" placeholder="Contact email" value={fields.email} onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))} />
        <Input placeholder="Street address" value={fields.address} onChange={(e) => setFields((f) => ({ ...f, address: e.target.value }))} />
        <div className="flex gap-3">
          <Input placeholder="City" value={fields.city} onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))} />
          <Input placeholder="Province" className="w-24" value={fields.province} onChange={(e) => setFields((f) => ({ ...f, province: e.target.value }))} />
        </div>
      </div>
      <SaveButton onSave={async () => { await new Promise((r) => setTimeout(r, 500)); }} />
    </SettingsSection>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Configuration
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
      </div>

      <div className="space-y-4">
        <ClinicProfileSettings />
        <SmsSettings />
        <FaxSettings />
        <SmtpSettings />
        <CredentialsSettings />
      </div>
    </div>
  );
}
