"use client";

import React, { useEffect, useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MspFacilityNumberApplicationSection } from "@/components/clinic/msp-facility-number-application";
import { TeleplanServiceApplicationSection } from "@/components/clinic/teleplan-service-application";
import { readClinicLoginSession } from "@/lib/clinic/session";
import {
  fetchClinicSettingsCredentials,
  fetchClinicSettingsProfile,
  fetchClinicSettingsSmtp,
  updateClinicSettingsCredentials,
  updateClinicSettingsProfile,
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
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white">
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
  const [error, setError] = useState("");

  async function handle() {
    setSaving(true);
    setError("");

    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
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
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
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
            (typeof record.smtp_host === "string" && record.smtp_host) ||
            (typeof record.host === "string" && record.host) ||
            "smtp.gmail.com",
          port:
            (typeof record.smtp_port === "number" && String(record.smtp_port)) ||
            (typeof record.smtp_port === "string" && record.smtp_port) ||
            (typeof record.port === "string" && record.port) ||
            "587",
          username:
            (typeof record.smtp_username === "string" && record.smtp_username) ||
            (typeof record.username === "string" && record.username) ||
            "",
          password:
            (typeof record.smtp_password === "string" && record.smtp_password) ||
            (typeof record.password === "string" && record.password) ||
            "",
          senderName:
            (typeof record.from_name === "string" && record.from_name) ||
            (typeof record.sender_name === "string" && record.sender_name) ||
            "Bimble Clinic",
          senderEmail:
            (typeof record.from_email === "string" && record.from_email) ||
            (typeof record.sender_email === "string" && record.sender_email) ||
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
      smtp_host: fields.host,
      smtp_port: Number(fields.port) || 587,
      smtp_username: fields.username,
      smtp_password: fields.password,
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
        <div className="w-full space-y-3">
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
    currentPin: "",
    newPassword: "",
    confirmPassword: "",
    newPin: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
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
      fields.currentPin.trim() !== "" &&
      fields.newPassword.length >= 8 &&
      fields.newPassword === fields.confirmPassword
    );
  }

  return (
    <SettingsSection icon={KeyRound} title="Login credentials" description="Update your password and PIN">
      <div className="w-full space-y-3">
        <SecretInput
          value={fields.currentPassword}
          placeholder="Current password"
          visible={showCurrentPassword}
          onToggleVisible={() => setShowCurrentPassword((v) => !v)}
          onChange={(value) => {
            setFields((f) => ({ ...f, currentPassword: value }));
            setError("");
          }}
        />
        <SecretInput
          value={fields.currentPin}
          placeholder="Current PIN"
          visible={showCurrentPin}
          onToggleVisible={() => setShowCurrentPin((v) => !v)}
          maxLength={4}
          inputMode="numeric"
          onChange={(value) => {
            setFields((f) => ({ ...f, currentPin: value.replace(/\D/g, "") }));
            setError("");
          }}
        />
        <SecretInput
          value={fields.newPassword}
          placeholder="New password (min 8 characters)"
          visible={showNewPassword}
          onToggleVisible={() => setShowNewPassword((v) => !v)}
          onChange={(value) => {
            setFields((f) => ({ ...f, newPassword: value }));
            setError("");
          }}
        />
        <SecretInput
          value={fields.confirmPassword}
          placeholder="Confirm new password"
          visible={showConfirmPassword}
          onToggleVisible={() => setShowConfirmPassword((v) => !v)}
          onChange={(value) => {
            setFields((f) => ({ ...f, confirmPassword: value }));
            setError("");
          }}
        />
        {fields.confirmPassword && fields.newPassword !== fields.confirmPassword && (
          <p className="text-xs text-destructive">Passwords don&apos;t match.</p>
        )}
        <SecretInput
          value={fields.newPin}
          placeholder="New PIN (4 digits, optional)"
          visible={showNewPin}
          onToggleVisible={() => setShowNewPin((v) => !v)}
          maxLength={4}
          inputMode="numeric"
          onChange={(value) =>
            setFields((f) => ({ ...f, newPin: value.replace(/\D/g, "") }))
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
            current_pin: fields.currentPin,
            new_password: fields.newPassword,
            new_pin: fields.newPin || undefined,
          });
        }}
        label="Update credentials"
      />
    </SettingsSection>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisible,
  maxLength,
  inputMode,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
  maxLength?: number;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        onClick={onToggleVisible}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
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
      <div className="w-full space-y-3">
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
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Configuration
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
      </div>

      <div className="space-y-4">
        <TeleplanServiceApplicationSection />
        <MspFacilityNumberApplicationSection />
        <ClinicProfileSettings />
        <SmtpSettings />
        <CredentialsSettings />
      </div>
    </div>
  );
}
