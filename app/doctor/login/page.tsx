"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ChevronRight, Stethoscope } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicCredentialsCard } from "@/components/clinic-access/clinic-credentials-card";
import { ClinicForgotPasswordWizard } from "@/components/clinic-access/clinic-forgot-password-wizard";
import { ClinicOtpCard } from "@/components/clinic-access/clinic-otp-card";
import { Button } from "@/components/ui/button";
import {
  storeDoctorLoginSession,
  storeDoctorOtpToken,
  storeDoctorSelectionToken,
  clearDoctorSelectionToken,
  clearDoctorOtpToken,
} from "@/lib/doctor/session";
import type {
  DoctorAcceptExistingInviteResponse,
  DoctorClinicOption,
  DoctorInviteDetailsResponse,
  DoctorLoginFormData,
  DoctorLoginStep1Response,
  DoctorSelectClinicResponse,
} from "@/lib/doctor/types";

// ── Types ─────────────────────────────────────────────────────────

type LoginStep = "credentials" | "otp" | "clinic_select" | "forgot";

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

async function fetchDoctorInviteDetails(inviteToken: string) {
  const res = await fetch(`/api/v1/doctor-auth/invite/${inviteToken}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Could not load invite details.");
  }
  return (await res.json()) as DoctorInviteDetailsResponse;
}

async function acceptDoctorExistingInvite(accessToken: string, inviteToken: string) {
  const res = await fetch("/api/v1/doctor-auth/invite-accept-existing", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ invite_token: inviteToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Could not join clinic.");
  }
  return (await res.json()) as DoctorAcceptExistingInviteResponse;
}

async function switchDoctorClinic(accessToken: string, clinicSlug: string) {
  const res = await fetch("/api/v1/doctor-auth/switch-clinic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ clinic_slug: clinicSlug }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Could not switch clinic.");
  }
  return (await res.json()) as DoctorSelectClinicResponse;
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
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite_token")?.trim() ?? "";

  const [step, setStep] = useState<LoginStep>("credentials");
  const [formData, setFormData] = useState<DoctorLoginFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsError, setCredentialsError] = useState("");
  const [credentialsNotice, setCredentialsNotice] = useState("");

  const [otpToken, setOtpToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState("");

  const [clinicOptions, setClinicOptions] = useState<DoctorClinicOption[]>([]);
  const [selectingClinic, setSelectingClinic] = useState<string | null>(null);
  const [clinicSelectError, setClinicSelectError] = useState("");
  const [inviteNotice, setInviteNotice] = useState("");

  async function finalizeDoctorSession(
    response: {
      access_token: string;
      doctor_id: number;
      clinic_slug: string;
      clinic_name: string;
      app_url: string;
      oscar_app_url?: string | null;
      emr_launch_url?: string | null;
    },
    options: { inviteToken?: string } = {},
  ) {
    let finalResponse = response;

    if (options.inviteToken) {
      const invite = await fetchDoctorInviteDetails(options.inviteToken);
      if (!invite.already_member) {
        await acceptDoctorExistingInvite(response.access_token, options.inviteToken);
      }
      finalResponse = await switchDoctorClinic(response.access_token, invite.clinic_slug);
      setInviteNotice(`You have joined ${invite.clinic_name}.`);
    }

    storeDoctorLoginSession({
      doctorId: finalResponse.doctor_id,
      clinicSlug: finalResponse.clinic_slug,
      clinicName: finalResponse.clinic_name,
      accessToken: finalResponse.access_token,
      appUrl: finalResponse.app_url,
      oscarAppUrl: finalResponse.oscar_app_url ?? undefined,
      emrLaunchUrl: finalResponse.emr_launch_url ?? undefined,
    });

    router.replace("/doctor/dashboard");
  }

  function updateField(field: keyof DoctorLoginFormData, value: string) {
    setFormData((f) => ({ ...f, [field]: value }));
    setCredentialsError("");
  }

  async function handleLogin() {
    setIsSubmitting(true);
    setCredentialsError("");
    setCredentialsNotice("");
    try {
      const response = (await submitDoctorLogin(formData)) as DoctorLoginStep1Response;

      const hasDirectSession = Boolean(
        response.access_token &&
          response.clinic_slug &&
          response.clinic_name &&
          response.app_url &&
          response.doctor_id,
      );
      const needsClinicSelection = Boolean(
        response.needs_clinic_selection &&
          response.selection_token &&
          response.clinics?.length,
      );

      if (hasDirectSession || !response.requires_otp) {
        if (needsClinicSelection) {
          setClinicOptions(response.clinics ?? []);
          storeDoctorSelectionToken(response.selection_token ?? "");
          setStep("clinic_select");
          return;
        }

        if (
          !response.access_token ||
          !response.clinic_slug ||
          !response.clinic_name ||
          !response.app_url ||
          !response.doctor_id
        ) {
          throw new Error(
            "Your account was updated, but the login response did not include a session.",
          );
        }

        await finalizeDoctorSession(
          {
            access_token: response.access_token,
            doctor_id: response.doctor_id,
            clinic_slug: response.clinic_slug,
            clinic_name: response.clinic_name,
            app_url: response.app_url,
            oscar_app_url: response.oscar_app_url,
            emr_launch_url: response.emr_launch_url,
          },
          { inviteToken },
        );
        return;
      }

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
        await finalizeDoctorSession(
          {
            access_token: response.access_token,
            doctor_id: response.doctor_id,
            clinic_slug: response.clinic_slug,
            clinic_name: response.clinic_name,
            app_url: response.app_url,
            oscar_app_url: response.oscar_app_url,
            emr_launch_url: response.emr_launch_url,
          },
          { inviteToken },
        );
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
      await finalizeDoctorSession(
        {
          access_token: response.access_token,
          doctor_id: response.doctor_id,
          clinic_slug: response.clinic_slug,
          clinic_name: response.clinic_name,
          app_url: response.app_url,
          oscar_app_url: response.oscar_app_url,
          emr_launch_url: response.emr_launch_url,
        },
        { inviteToken },
      );
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

  function handleStartForgotPassword() {
    setCredentialsError("");
    setCredentialsNotice("");
    setStep("forgot");
  }

  return (
    <ClinicFlowShell backHref="/" backLabel="Back to home">
      {step === "forgot" && (
        <ClinicForgotPasswordWizard
          initialEmail={formData.email}
          accountType="doctor"
          onCancel={handleBackToCredentials}
          onSuccess={(message) => {
            setCredentialsNotice(message);
          }}
        />
      )}

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

          {inviteToken && (
            <div className="mb-4 max-w-xl rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              Sign in to join the invited clinic and add it to your doctor account.
            </div>
          )}

          {credentialsNotice && (
            <div className="mb-4 max-w-xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {credentialsNotice}
            </div>
          )}

          {inviteNotice && (
            <div className="mb-4 max-w-xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {inviteNotice}
            </div>
          )}

          <ClinicCredentialsCard
            formData={formData}
            isLoggingIn={isSubmitting}
            loginError={credentialsError}
            onLogin={() => void handleLogin()}
            onForgotPassword={handleStartForgotPassword}
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
