"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronDown, ChevronUp, Eye, EyeOff, FileText, KeyRound, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AdditionalPaymentNumberApplicationSection } from "@/components/clinic/additional-payment-number-application";
import { ExcellerisAcceptableUseSection } from "@/components/clinic/excelleris-acceptable-use-form";
import { Hl7HealthCareProviderSetupSection } from "@/components/clinic/hl7-health-care-provider-setup-form";
import { PhysicianChangeInformationSection } from "@/components/clinic/physician-change-information-form";
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

type ClinicFormHubKey =
  | "teleplan"
  | "mspFacility"
  | "physicianChange"
  | "additionalPayment"
  | "excelleris"
  | "hl7";

type ClinicFormHubConfig = {
  badge: string;
  title: string;
  subtitle: string;
  component: React.ComponentType<{ autoOpen?: boolean; onRequestClose?: () => void }>;
};

const CLINIC_FORM_HUB: Record<ClinicFormHubKey, ClinicFormHubConfig> = {
  teleplan: {
    badge: "HLTH 2820",
    title: "Application for Teleplan Service",
    subtitle: "Teleplan service application",
    component: TeleplanServiceApplicationSection,
  },
  mspFacility: {
    badge: "HLTH 2948",
    title: "Application for MSP Facility Number",
    subtitle: "Facility number application",
    component: MspFacilityNumberApplicationSection,
  },
  physicianChange: {
    badge: "Clinic settings",
    title: "Physician Change Information",
    subtitle: "Update clinic physician details",
    component: PhysicianChangeInformationSection,
  },
  additionalPayment: {
    badge: "Clinic settings",
    title: "Additional Payment Number",
    subtitle: "Payment setup form",
    component: AdditionalPaymentNumberApplicationSection,
  },
  excelleris: {
    badge: "Clinic settings",
    title: "Excelleris Acceptable Use",
    subtitle: "Provider agreement",
    component: ExcellerisAcceptableUseSection,
  },
  hl7: {
    badge: "Clinic settings",
    title: "HL7 Health Care Provider Setup",
    subtitle: "Report delivery setup",
    component: Hl7HealthCareProviderSetupSection,
  },
};

const CLINIC_FORM_HUB_ORDER: ClinicFormHubKey[] = [
  "teleplan",
  "mspFacility",
  "physicianChange",
  "additionalPayment",
  "excelleris",
  "hl7",
];

function SettingsSection({
  icon: Icon,
  title,
  description,
  action,
  dense = false,
  children,
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
  dense?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className={cn("flex items-center justify-between gap-4 px-6 py-5", dense && "px-5 py-2.5")}>
        <div className={cn("flex min-w-0 items-center gap-3", dense && "gap-2.5")}>
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white", dense && "h-7 w-7 rounded-lg")}>
            <Icon className={cn("h-4 w-4 text-primary", dense && "h-3.5 w-3.5")} />
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-semibold text-foreground", dense && "leading-tight")}>{title}</p>
            <p className={cn("text-xs text-muted-foreground", dense && "leading-tight")}>{description}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("space-y-4 px-6 py-5", dense && "px-5 pb-3 pt-0")}>{children}</div>
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
  const [showClinicFormsHub, setShowClinicFormsHub] = useState(false);
  const [activeClinicForm, setActiveClinicForm] = useState<ClinicFormHubKey | null>(null);

  useEffect(() => {
    if (!activeClinicForm) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveClinicForm(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeClinicForm]);

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
        <SettingsSection
          icon={FileText}
          title="Onboarding forms"
          description="open the clinic onboarding forms"
          dense
          action={
            <Button
              type="button"
              variant={showClinicFormsHub ? "outline" : "default"}
              size="sm"
              className="gap-2"
              onClick={() => setShowClinicFormsHub((value) => !value)}
            >
              {showClinicFormsHub ? (
                <>
                  Hide forms
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Open forms
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </Button>
          }
        >
          <div className="space-y-4">
            {showClinicFormsHub ? (
              <div className="grid gap-3">
                {CLINIC_FORM_HUB_ORDER.map((key) => {
                  const form = CLINIC_FORM_HUB[key];

                  return (
                    <Button
                      key={key}
                      type="button"
                      variant="outline"
                      className="!flex h-auto !w-full !justify-between gap-4 px-4 py-4 text-left"
                      onClick={() => setActiveClinicForm(key)}
                    >
                      <span className="flex flex-1 flex-col items-start space-y-1 text-left">
                        <span className="block font-medium text-foreground">{form.title}</span>
                        <span className="block text-xs text-muted-foreground">{form.subtitle}</span>
                      </span>
                      <span className="shrink-0 text-sm font-medium text-foreground">Open</span>
                    </Button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </SettingsSection>
        <ClinicProfileSettings />
        <SmtpSettings />
        <CredentialsSettings />
      </div>

      {activeClinicForm ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 py-8 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setActiveClinicForm(null);
            }
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  {CLINIC_FORM_HUB[activeClinicForm].badge}
                </p>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {CLINIC_FORM_HUB[activeClinicForm].title}
                </h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveClinicForm(null)}>
                Close
              </Button>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2">
              {React.createElement(CLINIC_FORM_HUB[activeClinicForm].component, {
                autoOpen: true,
                onRequestClose: () => setActiveClinicForm(null),
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
