"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronRight, Stethoscope } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicCredentialsCard } from "@/components/clinic-access/clinic-credentials-card";
import { ClinicOtpCard } from "@/components/clinic-access/clinic-otp-card";
import { Button } from "@/components/ui/button";
import {
  storeDoctorLoginSession,
  storeDoctorOtpToken,
  storeDoctorSelectionToken,
  clearDoctorSelectionToken,
  clearDoctorOtpToken,
} from "@/lib/doctor/session";
import type { DoctorClinicOption, DoctorLoginFormData } from "@/lib/doctor/types";

// ── Types ─────────────────────────────────────────────────────────

type LoginStep = "credentials" | "otp" | "clinic_select";

const emptyForm: DoctorLoginFormData = {
  email: "",
  password: "",
};

// ── Stub API calls (replace with real endpoints once backend is ready) ──

async function submitDoctorLogin(
  data: DoctorLoginFormData,
): Promise<{ otp_token: string; masked_email: string }> {
  // POST /api/v1/doctor-auth/login
  const res = await fetch("/api/v1/doctor-auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, password: data.password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Login failed. Please check your credentials.");
  }
  return res.json();
}

async function submitDoctorVerifyOtp(otpToken: string, otpCode: string) {
  // POST /api/v1/doctor-auth/verify-otp
  const res = await fetch("/api/v1/doctor-auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp_token: otpToken, otp_code: otpCode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Verification failed. Please try again.");
  }
  return res.json();
}

async function submitDoctorResendOtp(otpToken: string) {
  const res = await fetch("/api/v1/doctor-auth/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otp_token: otpToken }),
  });
  if (!res.ok) throw new Error("Could not resend the code. Please try again.");
  return res.json();
}

async function submitDoctorSelectClinic(selectionToken: string, clinicSlug: string) {
  const res = await fetch("/api/v1/doctor-auth/select-clinic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selection_token: selectionToken, clinic_slug: clinicSlug }),
  });
  if (!res.ok) throw new Error("Could not select clinic. Please try again.");
  return res.json();
}

// ── Clinic picker ─────────────────────────────────────────────────

function ClinicPicker({
  clinics,
  onSelect,
  loading,
}: {
  clinics: DoctorClinicOption[];
  onSelect: (slug: string) => void;
  loading: string | null; // the slug currently loading, or null
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        You&apos;re linked to multiple clinics. Choose which one you&apos;re working at today.
      </p>
      <div className="space-y-2">
        {clinics.map((clinic) => (
          <button
            key={clinic.clinic_slug}
            onClick={() => onSelect(clinic.clinic_slug)}
            disabled={loading !== null}
            className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 text-left transition-all hover:border-primary/40 hover:bg-accent/30 disabled:opacity-50"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{clinic.clinic_name}</p>
              <p className="text-xs text-muted-foreground">{clinic.clinic_slug}</p>
            </div>
            {loading === clinic.clinic_slug ? (
              <span className="text-xs text-muted-foreground">Loading…</span>
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function DoctorLoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<LoginStep>("credentials");
  const [formData, setFormData] = useState<DoctorLoginFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsError, setCredentialsError] = useState("");

  const [otpToken, setOtpToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [clinicOptions, setClinicOptions] = useState<DoctorClinicOption[]>([]);
  const [selectingClinic, setSelectingClinic] = useState<string | null>(null);
  const [clinicSelectError, setClinicSelectError] = useState("");

  function updateField(field: keyof DoctorLoginFormData, value: string) {
    setFormData((f) => ({ ...f, [field]: value }));
    setCredentialsError("");
  }

  async function handleLogin() {
    setIsSubmitting(true);
    setCredentialsError("");
    try {
      const response = await submitDoctorLogin(formData);
      setOtpToken(response.otp_token);
      storeDoctorOtpToken(response.otp_token);
      setMaskedEmail(response.masked_email);
      setOtpCode("");
      setOtpError("");
      setStep("otp");
    } catch (error) {
      setCredentialsError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 8) return;
    setIsVerifying(true);
    setOtpError("");
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await submitDoctorVerifyOtp(otpToken, otpCode);
      clearDoctorOtpToken();

      if (response.needs_clinic_selection) {
        // Multi-clinic: show picker
        setClinicOptions(response.clinics);
        storeDoctorSelectionToken(response.selection_token);
        setStep("clinic_select");
      } else {
        // Single clinic: session ready
        storeDoctorLoginSession({
          doctorId: response.doctor_id,
          clinicSlug: response.clinic_slug,
          clinicName: response.clinic_name,
          accessToken: response.access_token,
          appUrl: response.app_url,
        });
        router.push("/doctor/dashboard");
      }
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    setIsResending(true);
    setOtpError("");
    try {
      const response = await submitDoctorResendOtp(otpToken);
      setOtpToken(response.otp_token);
      storeDoctorOtpToken(response.otp_token);
      setMaskedEmail(response.masked_email);
      setOtpCode("");
    } catch (error) {
      setOtpError(error instanceof Error ? error.message : "Could not resend.");
    } finally {
      setIsResending(false);
    }
  }

  async function handleSelectClinic(clinicSlug: string) {
    setSelectingClinic(clinicSlug);
    setClinicSelectError("");
    try {
      const selToken = sessionStorage.getItem("bimble:doctor:selection-token") ?? "";
      const response = await submitDoctorSelectClinic(selToken, clinicSlug);
      clearDoctorSelectionToken();
      storeDoctorLoginSession({
        doctorId: response.doctor_id,
        clinicSlug: response.clinic_slug,
        clinicName: response.clinic_name,
        accessToken: response.access_token,
        appUrl: response.app_url,
      });
      router.push("/doctor/dashboard");
    } catch (error) {
      setClinicSelectError(error instanceof Error ? error.message : "Could not select clinic.");
    } finally {
      setSelectingClinic(null);
    }
  }

  function handleBackToCredentials() {
    setStep("credentials");
    setOtpCode("");
    setOtpError("");
    setOtpToken("");
    setMaskedEmail("");
  }

  return (
    <ClinicFlowShell backHref="/" backLabel="Back to home">
      {step === "credentials" && (
        <>
          <div className="mb-6 max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Doctor login</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Doctor Sign In
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter your email and password. We&apos;ll send a verification code to confirm it&apos;s you.
            </p>
          </div>

          <ClinicCredentialsCard
            formData={formData}
            isLoggingIn={isSubmitting}
            loginError={credentialsError}
            onLogin={() => void handleLogin()}
            onFieldChange={updateField}
          />
        </>
      )}

      {step === "otp" && (
        <>
          <div className="mb-6 max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Check Your Email
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              For your security, we sent a one-time code to verify your identity.
            </p>
          </div>

          <ClinicOtpCard
            maskedEmail={maskedEmail}
            otpCode={otpCode}
            isVerifying={isVerifying}
            isResending={isResending}
            verifyError={otpError}
            onOtpChange={setOtpCode}
            onVerify={() => void handleVerifyOtp()}
            onResend={() => void handleResendOtp()}
            onBack={handleBackToCredentials}
          />
        </>
      )}

      {step === "clinic_select" && (
        <>
          <div className="mb-6 max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Which clinic today?
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              You&apos;re linked to more than one clinic. Select where you&apos;re working right now.
            </p>
          </div>

          <ClinicPicker
            clinics={clinicOptions}
            onSelect={handleSelectClinic}
            loading={selectingClinic}
          />

          {clinicSelectError && (
            <p className="mt-3 text-sm text-destructive">{clinicSelectError}</p>
          )}

          <div className="mt-4">
            <Button variant="ghost" size="sm" onClick={handleBackToCredentials}>
              Start over
            </Button>
          </div>
        </>
      )}
    </ClinicFlowShell>
  );
}
