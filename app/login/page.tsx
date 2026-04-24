"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicCredentialsCard } from "@/components/clinic-access/clinic-credentials-card";
import { ClinicForgotPasswordWizard } from "@/components/clinic-access/clinic-forgot-password-wizard";
import { ClinicOtpCard } from "@/components/clinic-access/clinic-otp-card";
import {
  submitClinicLogin,
  submitClinicVerifyOtp,
  submitClinicResendOtp,
} from "@/lib/api/clinic";
import {
  clearClinicSessionState,
  storeClinicLoginSession,
} from "@/lib/clinic/session";
import type { ClinicLoginFormData } from "@/lib/clinic/types";
import type { ClinicLoginStep1Response } from "@/lib/clinic/types";

type LoginStep = "credentials" | "otp" | "forgot";

const emptyForm: ClinicLoginFormData = {
  email: "",
  password: "",
};

export default function ClinicLoginPage() {
  const router = useRouter();

  // --- Step tracking ---
  const [step, setStep] = useState<LoginStep>("credentials");

  // --- Step 1 state ---
  const [formData, setFormData] = useState<ClinicLoginFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [credentialsError, setCredentialsError] = useState("");
  const [credentialsNotice, setCredentialsNotice] = useState("");

  // --- Step 2 state ---
  const [otpToken, setOtpToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otpError, setOtpError] = useState("");

  // --- Step 1 handlers ---
  function updateField(field: keyof ClinicLoginFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
    setCredentialsError("");
  }

  async function handleLogin() {
    setIsSubmitting(true);
    setCredentialsError("");
    setCredentialsNotice("");

    try {
      const response = await submitClinicLogin(formData) as ClinicLoginStep1Response;

      const hasDirectSession =
        Boolean(response.access_token && response.clinic_slug && response.app_url);

      if (hasDirectSession || !response.requires_otp) {
        if (!response.access_token || !response.clinic_slug || !response.app_url) {
          throw new Error(
            "Your account was updated, but the login response did not include a session.",
          );
        }

        clearClinicSessionState();
        storeClinicLoginSession({
          clinicSlug: response.clinic_slug,
          clinicName: response.clinic_name,
          accessToken: response.access_token,
          appUrl: response.app_url,
          bootstrapUrl: response.bootstrap_url,
          emrLaunchUrl: response.emr_launch_url,
        });

        router.push("/clinic/dashboard");
        return;
      }

      setOtpToken(response.otp_token);
      setMaskedEmail(response.masked_email);
      setOtpCode("");
      setOtpError("");
      setStep("otp");
    } catch (error) {
      setCredentialsError(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Step 2 handlers ---
  async function handleVerifyOtp() {
    if (otpCode.length !== 8) return;

    setIsVerifying(true);
    setOtpError("");

    try {
      const response = await submitClinicVerifyOtp({ otp_token: otpToken, otp_code: otpCode });

      clearClinicSessionState();
      storeClinicLoginSession({
        clinicSlug: response.clinic_slug,
        clinicName: response.clinic_name,
        accessToken: response.access_token,
        appUrl: response.app_url,
        bootstrapUrl: response.bootstrap_url,
        emrLaunchUrl: response.emr_launch_url,
      });

      router.push("/clinic/dashboard");
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : "Verification failed. Please check the code and try again.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    setIsResending(true);
    setOtpError("");

    try {
      const response = await submitClinicResendOtp({ otp_token: otpToken });
      // The backend invalidates the old token and issues a new one
      setOtpToken(response.otp_token);
      setMaskedEmail(response.masked_email);
      setOtpCode("");
    } catch (error) {
      setOtpError(
        error instanceof Error
          ? error.message
          : "Could not resend the code. Please try again.",
      );
    } finally {
      setIsResending(false);
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
    <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
      {step === "forgot" ? (
        <ClinicForgotPasswordWizard
          initialEmail={formData.email}
          onCancel={handleBackToCredentials}
          onSuccess={(message) => {
            setCredentialsNotice(message);
          }}
        />
      ) : step === "credentials" ? (
        <>
          <div className="mb-6 max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Clinic Sign In
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Enter your email and password. We will send a verification code to your email.
            </p>
          </div>

          {credentialsNotice && (
            <div className="mb-4 max-w-xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {credentialsNotice}
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
      ) : (
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
    </ClinicFlowShell>
  );
}
