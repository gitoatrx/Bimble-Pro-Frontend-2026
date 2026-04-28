"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PatientOtpCardProps = {
  channel: string;
  message: string;
  otpCode: string;
  isVerifying: boolean;
  isResending: boolean;
  error: string;
  onOtpChange: (value: string) => void;
  onVerify: () => void;
  onResend: () => void;
  onBack: () => void;
};

export function PatientOtpCard({
  channel,
  message,
  otpCode,
  isVerifying,
  isResending,
  error,
  onOtpChange,
  onVerify,
  onResend,
  onBack,
}: PatientOtpCardProps) {
  return (
    <div className="rounded-[28px] border border-border/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="grid gap-5">
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          <div className="font-semibold">{channel} verification</div>
          <div className="mt-1">{message}</div>
        </div>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          One-time password
          <Input
            value={otpCode}
            onChange={(event) => onOtpChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="Enter the 6-digit OTP"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="h-12 flex-1 rounded-2xl"
            onClick={onVerify}
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying ? "Verifying..." : "Verify and continue"}
          </Button>
          <Button
            className="h-12 rounded-2xl"
            variant="outline"
            onClick={onResend}
            disabled={isResending}
          >
            {isResending ? "Resending..." : "Resend OTP"}
          </Button>
          <Button
            className="h-12 rounded-2xl"
            variant="ghost"
            onClick={onBack}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
