"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Smartphone } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { PatientLoginCard } from "@/components/patient/patient-login-card";
import { PatientOtpCard } from "@/components/patient/patient-otp-card";
import { submitPatientPhoneLogin, submitPatientVerifyOtp } from "@/lib/api/patient";
import { readPatientLoginSession, storePatientLoginSession } from "@/lib/patient/session";

type LoginStep = "identify" | "otp";

export default function PatientPortalLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>("identify");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [patientId, setPatientId] = useState<number | null>(null);
  const [channel, setChannel] = useState("SMS");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const storedSession = readPatientLoginSession();
    if (storedSession) {
      router.replace("/patient-portal/profile");
    }
  }, [router]);

  async function handleSendOtp() {
    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await submitPatientPhoneLogin({
        phone: phone.trim(),
        date_of_birth: dateOfBirth,
      });
      setPatientId(response.patient_id);
      setChannel(response.channel);
      setNotice(response.message);
      setOtpCode("");
      setStep("otp");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not send the OTP right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    if (!patientId) return;

    setIsVerifying(true);
    setError("");

    try {
      const response = await submitPatientVerifyOtp({
        patient_id: patientId,
        otp_code: otpCode,
      });
      storePatientLoginSession({
        patientId: response.patient_id,
        accessToken: response.access_token,
      });
      router.replace("/patient-portal/profile");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not verify the OTP right now.",
      );
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    setIsResending(true);
    setError("");

    try {
      const response = await submitPatientPhoneLogin({
        phone: phone.trim(),
        date_of_birth: dateOfBirth,
      });
      setPatientId(response.patient_id);
      setChannel(response.channel);
      setNotice(response.message);
      setOtpCode("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not resend the OTP right now.",
      );
    } finally {
      setIsResending(false);
    }
  }

  function handleBack() {
    setStep("identify");
    setOtpCode("");
    setError("");
  }

  return (
    <ClinicFlowShell
      backHref="/"
      backLabel="Back to home"
      workspaceLabel="Find care"
      contentClassName="max-w-5xl"
    >
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div className="rounded-[32px] border border-sky-200/70 bg-[linear-gradient(135deg,#f8fbff_0%,#e0f2fe_54%,#ecfeff_100%)] p-8 shadow-[0_32px_100px_rgba(14,116,144,0.12)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Patient access
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Secure patient login with phone, date of birth, and OTP.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            Patients can sign in, verify with a one-time code, and then manage appointments, profile details, requests, and family members in one place.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              "Book appointments directly from the profile page.",
              "Review current and past appointment history.",
              "Cancel or request a reschedule without calling the clinic.",
              "Request prescriptions, lab reports, and manage family members.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-700">
                <Smartphone className="mt-0.5 h-4 w-4 text-sky-700" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {step === "identify" ? "Patient Sign In" : "Verify OTP"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {step === "identify"
                ? "Enter the patient phone number and date of birth to receive a one-time code."
                : "Enter the OTP sent to the patient so we can open the profile securely."}
            </p>
          </div>

          {step === "identify" ? (
            <PatientLoginCard
              phone={phone}
              dateOfBirth={dateOfBirth}
              isSubmitting={isSubmitting}
              error={error}
              notice={notice}
              onPhoneChange={setPhone}
              onDateOfBirthChange={setDateOfBirth}
              onSubmit={() => void handleSendOtp()}
            />
          ) : (
            <PatientOtpCard
              channel={channel}
              message={notice}
              otpCode={otpCode}
              isVerifying={isVerifying}
              isResending={isResending}
              error={error}
              onOtpChange={setOtpCode}
              onVerify={() => void handleVerifyOtp()}
              onResend={() => void handleResendOtp()}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </ClinicFlowShell>
  );
}
