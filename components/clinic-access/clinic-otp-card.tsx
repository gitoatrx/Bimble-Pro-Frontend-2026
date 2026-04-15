"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClinicOtpCardProps = {
  maskedEmail: string;
  otpCode: string;
  isVerifying?: boolean;
  isResending?: boolean;
  verifyError?: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
};

const neutralFieldClassName =
  "h-12 !border-border !bg-white !text-foreground !shadow-none text-center text-xl tracking-[0.35em] font-semibold focus-visible:ring-primary/20";

export function ClinicOtpCard({
  maskedEmail,
  otpCode,
  isVerifying = false,
  isResending = false,
  verifyError,
  onOtpChange,
  onVerify,
  onResend,
  onBack,
}: ClinicOtpCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-focus the OTP input when the card mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer after a resend
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  function handleResend() {
    if (resendCooldown > 0 || isResending) return;
    setResendCooldown(60);
    onResend();
  }

  function handleOtpInput(value: string) {
    // Only allow digits, max 6 characters
    const digits = value.replace(/\D/g, "").slice(0, 6);
    onOtpChange(digits);
  }

  return (
    <form
      className="max-w-xl space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isVerifying && otpCode.length === 6) {
          onVerify();
        }
      }}
    >
      <div className="space-y-2 text-center">
        <p className="text-sm text-slate-600">
          A 6-digit code was sent to{" "}
          <span className="font-medium text-foreground">{maskedEmail}</span>.
          Enter it below to complete sign-in.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="otp-code"
          className="block text-sm font-medium text-foreground"
        >
          Verification Code
        </label>
        <Input
          ref={inputRef}
          id="otp-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          value={otpCode}
          onChange={(event) => handleOtpInput(event.target.value)}
          className={neutralFieldClassName}
          maxLength={6}
        />
      </div>

      <FieldError message={verifyError} />

      <Button
        type="submit"
        className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={isVerifying || otpCode.length !== 6}
      >
        {isVerifying ? "Verifying..." : "Verify & Sign In"}
      </Button>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-slate-500 hover:text-foreground"
          onClick={onBack}
          disabled={isVerifying}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto px-0 text-primary hover:text-primary/80"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0 || isVerifying}
        >
          <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : isResending
              ? "Sending..."
              : "Resend code"}
        </Button>
      </div>
    </form>
  );
}
