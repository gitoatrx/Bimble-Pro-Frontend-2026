"use client";

import React, { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Mail, MessageSquare, Printer, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { readClinicLoginSession } from "@/lib/clinic/session";
import {
  fetchClinicSettingsCredentials,
  fetchClinicSettingsFax,
  fetchClinicSettingsProfile,
  fetchClinicSettingsSms,
  fetchClinicSettingsSmtp,
  updateClinicSettingsCredentials,
  updateClinicSettingsFax,
  updateClinicSettingsProfile,
  updateClinicSettingsSms,
  updateClinicSettingsSmtp,
} from "@/lib/api/clinic-dashboard";

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
      <div className="space-y-4 px-6 py-5">{children}</div>
    </div>
  );
}

function SaveButton({
  onSave,
  label = "Save changes",
}: {
  onSave: () => Promise<void>;
  label?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handle() {
    setSaving(true);

    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button onClick={handle} disabled={saving} size="sm" className="gap-2">
      {saved ? (
        <>
          <Check className="h-3.5 w-3.5" /> Saved
        </>
      ) : saving ? (
        "Saving…"
      ) : (
        label
      )}
    </Button>
  );
}

function SmsSettings() {
  const session = readClinicLoginSession();
  const [enabled, setEnabled] = useState(true);
  const [provider, setProvider] = useState<"twilio" | "auth" | "swift">("twilio");
  const [fields, setFields] = useState({
    accountSid: "",
    authToken: "",
    fromNumber: "",
  });

  useEffect(() => {
    if (!session?.accessToken) return;

    fetchClinicSettingsSms(session.accessToken)
      .then((data) => {
        const record = data as Record<string, unknown>;
        setEnabled(record.enabled !== false);
        setProvider(
          (typeof record.provider === "string" && (record.provider as "twilio" | "auth" | "swift")) ||
            "twilio",
        );
        setFields({
          accountSid:
            (typeof record.account_sid === "string" && record.account_sid) ||
            (typeof record.accountSid === "string" && record.accountSid) ||
            "",
          authToken:
            (typeof record.auth_token === "string" && record.auth_token) ||
            (typeof record.authToken === "string" && record.authToken) ||
            "",
          fromNumber:
            (typeof record.from_number === "string" && record.from_number) ||
            (typeof record.fromNumber === "string" && record.fromNumber) ||
            "",
        });
      })
      .catch(() => {
        // Keep defaults if backend settings are unavailable.
      });
  }, [session?.accessToken]);

  async function handleSave() {
    if (!session?.accessToken) return;

    await updateClinicSettingsSms(session.accessToken, {
      enabled,
      provider,
      account_sid: fields.accountSid,
      auth_token: fields.authToken,
      from_number: fields.fromNumber,
    });
  }

  return (
    <SettingsSection icon={MessageSquare} title="Text messages" description="SMS notifications to patients">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Enabled</label>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-border",
          )}
        >
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {enabled && (
        <>
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
          <div className="max-w-sm space-y-3">
            <Input
              placeholder="Account SID"
              value={fields.accountSid}
              onChange={(e) => setFields((f) => ({ ...f, accountSid: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="Auth token"
              value={fields.authToken}
              onChange={(e) => setFields((f) => ({ ...f, authToken: e.target.value }))}
            />
            <Input
              placeholder="From number"
              value={fields.fromNumber}
              onChange={(e) => setFields((f) => ({ ...f, fromNumber: e.target.value }))}
            />
          </div>
        </>
      )}

      <SaveButton onSave={handleSave} />
    </SettingsSection>
  );
}

function FaxSettings() {
  const session = readClinicLoginSession();
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<"srfax" | "ringcentral">("srfax");
  const [fields, setFields] = useState({
    accountId: "",
    password: "",
    faxNumber: "",
  });

  useEffect(() => {
    if (!session?.accessToken) return;

    fetchClinicSettingsFax(session.accessToken)
      .then((data) => {
        const record = data as Record<string, unknown>;
        setEnabled(record.enabled !== false);
        setProvider(
          (typeof record.provider === "string" && (record.provider as "srfax" | "ringcentral")) ||
            "srfax",
        );
        setFields({
          accountId:
            (typeof record.account_id === "string" && record.account_id) ||
            (typeof record.accountId === "string" && record.accountId) ||
            "",
          password:
            (typeof record.password === "string" && record.password) ||
            (typeof record.secret === "string" && record.secret) ||
            "",
          faxNumber:
            (typeof record.fax_number === "string" && record.fax_number) ||
            (typeof record.faxNumber === "string" && record.faxNumber) ||
            "",
        });
      })
      .catch(() => {
        // Keep defaults if backend settings are unavailable.
      });
  }, [session?.accessToken]);

  async function handleSave() {
    if (!session?.accessToken) return;

    await updateClinicSettingsFax(session.accessToken, {
      enabled,
      provider,
      account_id: fields.accountId,
      password: fields.password,
      fax_number: fields.faxNumber,
    });
  }

  return (
    <SettingsSection icon={Printer} title="Fax" description="Send referrals and documents via fax">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Enabled</label>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-border",
          )}
        >
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {enabled && (
        <>
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
          <div className="max-w-sm space-y-3">
            <Input
              placeholder="Account number / Client ID"
              value={fields.accountId}
              onChange={(e) => setFields((f) => ({ ...f, accountId: e.target.value }))}
            />
            <Input
              type="password"
              placeholder="Password / Secret"
              value={fields.password}
              onChange={(e) => setFields((f) => ({ ...f, password: e.target.value }))}
            />
            <Input
              placeholder="Fax number"
              value={fields.faxNumber}
              onChange={(e) => setFields((f) => ({ ...f, faxNumber: e.target.value }))}
            />
          </div>
        </>
      )}

      <SaveButton onSave={handleSave} />
    </SettingsSection>
  );
}

function SmtpSettings() {
  const session = readClinicLoginSession();
  const [enabled, setEnabled] = useState(true);
  const [fields, setFields] = useState({
    host: "smtp.gmail.com",
    port: "587",
    username: "",
    password: "",
    senderName: "Bimble Clinic",
    senderEmail: "",
  });

  useEffect(() => {
    if (!session?.accessToken) return;

    fetchClinicSettingsSmtp(session.accessToken)
      .then((data) => {
        const record = data as Record<string, unknown>;
        setEnabled(record.enabled !== false);
        setFields({
          host:
            (typeof record.host === "string" && record.host) ||
            (typeof record.smtp_host === "string" && record.smtp_host) ||
            "smtp.gmail.com",
          port:
            (typeof record.port === "string" && record.port) ||
            (typeof record.smtp_port === "number" && String(record.smtp_port)) ||
            "587",
          username:
            (typeof record.username === "string" && record.username) ||
            (typeof record.smtp_username === "string" && record.smtp_username) ||
            "",
          password:
            (typeof record.password === "string" && record.password) ||
            (typeof record.smtp_password === "string" && record.smtp_password) ||
            "",
          senderName:
            (typeof record.sender_name === "string" && record.sender_name) ||
            (typeof record.from_name === "string" && record.from_name) ||
            "Bimble Clinic",
          senderEmail:
            (typeof record.sender_email === "string" && record.sender_email) ||
            (typeof record.from_email === "string" && record.from_email) ||
            "",
        });
      })
      .catch(() => {
        // Keep defaults if backend settings are unavailable.
      });
  }, [session?.accessToken]);

  async function handleSave() {
    if (!session?.accessToken) return;

    await updateClinicSettingsSmtp(session.accessToken, {
      enabled,
      host: fields.host,
      port: Number(fields.port) || 587,
      username: fields.username,
      password: fields.password,
      sender_name: fields.senderName,
      sender_email: fields.senderEmail,
    });
  }

  return (
    <SettingsSection icon={Mail} title="Email" description="Send appointment confirmations and reminders">
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Enabled</label>
        <button
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-border",
          )}
        >
          <span
            className={cn(
              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-4" : "translate-x-0.5",
            )}
          />
        </button>
      </div>

      {enabled && (
        <div className="max-w-sm space-y-3">
          <div className="flex gap-3">
            <Input
              className="flex-1"
              placeholder="SMTP host"
              value={fields.host}
              onChange={(e) => setFields((f) => ({ ...f, host: e.target.value }))}
            />
            <Input
              className="w-20"
              placeholder="Port"
              value={fields.port}
              onChange={(e) => setFields((f) => ({ ...f, port: e.target.value }))}
            />
          </div>
          <Input
            placeholder="SMTP username"
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
            placeholder="Sender name"
            value={fields.senderName}
            onChange={(e) => setFields((f) => ({ ...f, senderName: e.target.value }))}
          />
          <Input
            placeholder="Sender email"
            value={fields.senderEmail}
            onChange={(e) => setFields((f) => ({ ...f, senderEmail: e.target.value }))}
          />
        </div>
      )}

      <SaveButton onSave={handleSave} />
    </SettingsSection>
  );
}

function CredentialsSettings() {
  const session = readClinicLoginSession();
  const [fields, setFields] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    pin: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.accessToken) return;

    fetchClinicSettingsCredentials(session.accessToken).catch(() => {
      // This endpoint may only expose change capabilities.
    });
  }, [session?.accessToken]);

  function canSave() {
    return (
      fields.currentPassword.trim() !== "" &&
      fields.newPassword.length >= 8 &&
      fields.newPassword === fields.confirmPassword
    );
  }

  return (
    <SettingsSection icon={KeyRound} title="Login credentials" description="Update your password and PIN">
      <div className="max-w-sm space-y-3">
        <div className="relative">
          <Input
            type={showPw ? "text" : "password"}
            placeholder="Current password"
            value={fields.currentPassword}
            onChange={(e) => {
              setFields((f) => ({ ...f, currentPassword: e.target.value }));
              setError("");
            }}
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
          onChange={(e) => {
            setFields((f) => ({ ...f, newPassword: e.target.value }));
            setError("");
          }}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={fields.confirmPassword}
          onChange={(e) => {
            setFields((f) => ({ ...f, confirmPassword: e.target.value }));
            setError("");
          }}
          className={
            fields.confirmPassword && fields.newPassword !== fields.confirmPassword
              ? "!border-destructive"
              : ""
          }
        />
        {fields.confirmPassword && fields.newPassword !== fields.confirmPassword && (
          <p className="text-xs text-destructive">Passwords don&apos;t match.</p>
        )}
        <Input
          type="password"
          placeholder="New PIN (4 digits, optional)"
          value={fields.pin}
          maxLength={4}
          onChange={(e) =>
            setFields((f) => ({ ...f, pin: e.target.value.replace(/\D/g, "") }))
          }
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <SaveButton
        onSave={async () => {
          if (!session?.accessToken) return;
          if (!canSave()) {
            setError("Please fill in all required fields correctly.");
            return;
          }

          await updateClinicSettingsCredentials(session.accessToken, {
            current_password: fields.currentPassword,
            new_password: fields.newPassword,
            pin: fields.pin || undefined,
          });
        }}
        label="Update credentials"
      />
    </SettingsSection>
  );
}

function ClinicProfileSettings() {
  const session = readClinicLoginSession();
  const [fields, setFields] = useState({
    displayName: "Downtown Bimble Clinic",
    phone: "604 555 0142",
    email: "admin@bimbleclinic.ca",
    address: "123 Main St",
    city: "Vancouver",
    province: "BC",
  });

  useEffect(() => {
    if (!session?.accessToken) return;

    fetchClinicSettingsProfile(session.accessToken)
      .then((data) => {
        const record = data as Record<string, unknown>;
        setFields({
          displayName:
            (typeof record.display_name === "string" && record.display_name) ||
            (typeof record.clinic_name === "string" && record.clinic_name) ||
            "Downtown Bimble Clinic",
          phone:
            (typeof record.phone === "string" && record.phone) ||
            (typeof record.phone_number === "string" && record.phone_number) ||
            "",
          email:
            (typeof record.email === "string" && record.email) ||
            (typeof record.contact_email === "string" && record.contact_email) ||
            "",
          address:
            (typeof record.address === "string" && record.address) ||
            (typeof record.street_address === "string" && record.street_address) ||
            "",
          city: (typeof record.city === "string" && record.city) || "",
          province:
            (typeof record.province === "string" && record.province) ||
            (typeof record.state === "string" && record.state) ||
            "",
        });
      })
      .catch(() => {
        // Keep defaults if backend settings are unavailable.
      });
  }, [session?.accessToken]);

  async function handleSave() {
    if (!session?.accessToken) return;

    await updateClinicSettingsProfile(session.accessToken, {
      display_name: fields.displayName,
      phone: fields.phone,
      email: fields.email,
      address: fields.address,
      city: fields.city,
      province: fields.province,
    });
  }

  return (
    <SettingsSection icon={User} title="Clinic profile" description="Your clinic&apos;s public-facing details">
      <div className="max-w-sm space-y-3">
        <Input
          placeholder="Display name"
          value={fields.displayName}
          onChange={(e) => setFields((f) => ({ ...f, displayName: e.target.value }))}
        />
        <Input
          placeholder="Phone number"
          value={fields.phone}
          onChange={(e) => setFields((f) => ({ ...f, phone: e.target.value }))}
        />
        <Input
          type="email"
          placeholder="Contact email"
          value={fields.email}
          onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))}
        />
        <Input
          placeholder="Street address"
          value={fields.address}
          onChange={(e) => setFields((f) => ({ ...f, address: e.target.value }))}
        />
        <div className="flex gap-3">
          <Input
            placeholder="City"
            value={fields.city}
            onChange={(e) => setFields((f) => ({ ...f, city: e.target.value }))}
          />
          <Input
            placeholder="Province"
            className="w-24"
            value={fields.province}
            onChange={(e) => setFields((f) => ({ ...f, province: e.target.value }))}
          />
        </div>
      </div>
      <SaveButton onSave={handleSave} />
    </SettingsSection>
  );
}

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
