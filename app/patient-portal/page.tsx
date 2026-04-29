"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { PatientLoginCard } from "@/components/patient/patient-login-card";
import { PatientOtpCard } from "@/components/patient/patient-otp-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getLiveDigitCountError,
  getLiveFutureDateError,
  getLiveTenDigitError,
} from "@/lib/form-validation";
import {
  submitPatientPhoneLogin,
  submitPatientPhoneProfileLogin,
  submitPatientVerifyPhoneOtp,
} from "@/lib/api/patient";
import { readPatientLoginSession, storePatientLoginSession } from "@/lib/patient/session";

type LoginStep = "identify" | "otp" | "profile";

export default function PatientPortalLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const [step, setStep] = useState<LoginStep>("identify");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phn, setPhn] = useState("");
  const [dateOfBirthError, setDateOfBirthError] = useState("");
  const [phnError, setPhnError] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [channel, setChannel] = useState("SMS");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);

  useEffect(() => {
    const storedSession = readPatientLoginSession();
    if (storedSession && mode !== "login") {
      router.replace("/patient-portal/profile");
    }
  }, [mode, router]);

  async function handleSendOtp() {
    const normalizedPhone = phone.replace(/\D/g, "").slice(0, 10);
    const nextPhoneError = getLiveTenDigitError(normalizedPhone, "phone number");
    setPhoneError(nextPhoneError);

    if (nextPhoneError || normalizedPhone.length !== 10) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await submitPatientPhoneLogin({
        phone: normalizedPhone,
      });
      setOtpToken(response.otp_token);
      setChannel(response.channel);
      setNotice(
        response.debug_otp
          ? `${response.message} Test OTP: ${response.debug_otp}`
          : response.message,
      );
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
    if (!otpToken) return;

    setIsVerifying(true);
    setError("");

    try {
      const response = await submitPatientVerifyPhoneOtp({
        otp_token: otpToken,
        otp_code: otpCode,
      });
      setOtpToken(response.otp_token);
      setNotice(response.message);
      setStep("profile");
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
        phone: phone.replace(/\D/g, "").slice(0, 10),
      });
      setOtpToken(response.otp_token);
      setChannel(response.channel);
      setNotice(
        response.debug_otp
          ? `${response.message} Test OTP: ${response.debug_otp}`
          : response.message,
      );
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
    setStep(step === "profile" ? "otp" : "identify");
    setOtpCode("");
    setError("");
  }

  async function handleCompleteProfile() {
    if (!otpToken) return;

    const nextDateOfBirthError = getLiveFutureDateError(dateOfBirth, "Date of birth");
    const nextPhnError = getLiveDigitCountError(phn, "PHN", 10);
    setDateOfBirthError(nextDateOfBirthError);
    setPhnError(nextPhnError);

    if (!dateOfBirth || !phn.trim() || nextDateOfBirthError || nextPhnError) {
      setError("Enter a valid date of birth and 10-digit PHN.");
      return;
    }

    setIsCompletingProfile(true);
    setError("");

    try {
      const response = await submitPatientPhoneProfileLogin({
        otp_token: otpToken,
        date_of_birth: dateOfBirth,
        phn: phn.trim(),
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
          : "Could not match the patient profile right now.",
      );
    } finally {
      setIsCompletingProfile(false);
    }
  }

  return (
    <ClinicFlowShell
      backHref="/"
      backLabel="Back to home"
      contentClassName="max-w-xl"
    >
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {step === "identify"
              ? "Patient Sign In"
              : step === "otp"
                ? "Verify OTP"
                : "Confirm Your Profile"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {step === "identify"
              ? "Enter the patient phone number to receive a one-time code."
              : step === "otp"
                ? "Verify the phone number with the one-time code we just sent."
                : "Now enter the patient date of birth and PHN so we can open the correct family member profile."}
          </p>
        </div>

        {step === "identify" ? (
          <PatientLoginCard
            phone={phone}
            phoneError={phoneError}
            dateOfBirth={dateOfBirth}
            showDateOfBirth={false}
            isSubmitting={isSubmitting}
            error={error}
            notice={notice}
            onPhoneChange={(value) => {
              const nextPhone = value.replace(/\D/g, "").slice(0, 10);
              setPhone(nextPhone);
              setPhoneError(getLiveTenDigitError(nextPhone, "phone number"));
              setError("");
            }}
            onDateOfBirthChange={setDateOfBirth}
            onSubmit={() => void handleSendOtp()}
          />
        ) : step === "otp" ? (
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
        ) : (
          <div className="rounded-[28px] border border-border/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="grid gap-5">
              {notice ? (
                <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                  {notice}
                </div>
              ) : null}

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Date of birth
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setDateOfBirth(nextValue);
                    setDateOfBirthError(getLiveFutureDateError(nextValue, "Date of birth"));
                    setError("");
                  }}
                  autoComplete="bday"
                />
                {dateOfBirthError ? (
                  <span className="text-xs font-normal text-destructive">{dateOfBirthError}</span>
                ) : null}
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                PHN
                <Input
                  value={phn}
                  onChange={(event) => {
                    const nextValue = event.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhn(nextValue);
                    setPhnError(getLiveDigitCountError(nextValue, "PHN", 10));
                    setError("");
                  }}
                  inputMode="numeric"
                  placeholder="Enter the patient PHN"
                />
                {phnError ? (
                  <span className="text-xs font-normal text-destructive">{phnError}</span>
                ) : null}
              </label>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 flex-1 rounded-2xl"
                  onClick={() => void handleCompleteProfile()}
                  disabled={
                    isCompletingProfile ||
                    !dateOfBirth ||
                    !phn.trim() ||
                    Boolean(dateOfBirthError || phnError)
                  }
                >
                  {isCompletingProfile ? "Opening profile..." : "Open patient profile"}
                </Button>
                <Button
                  className="h-12 rounded-2xl"
                  variant="ghost"
                  onClick={handleBack}
                >
                  Back
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ClinicFlowShell>
  );
}
