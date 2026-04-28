"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      contentClassName="max-w-xl"
    >
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
    </ClinicFlowShell>
  );
}
