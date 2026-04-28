"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PatientLoginCardProps = {
  phone: string;
  dateOfBirth: string;
  isSubmitting: boolean;
  error: string;
  notice: string;
  onPhoneChange: (value: string) => void;
  onDateOfBirthChange: (value: string) => void;
  onSubmit: () => void;
};

export function PatientLoginCard({
  phone,
  dateOfBirth,
  isSubmitting,
  error,
  notice,
  onPhoneChange,
  onDateOfBirthChange,
  onSubmit,
}: PatientLoginCardProps) {
  return (
    <div className="rounded-[28px] border border-border/80 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Phone number
          <Input
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            placeholder="Enter the phone on file"
            autoComplete="tel"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Date of birth
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(event) => onDateOfBirthChange(event.target.value)}
            autoComplete="bday"
          />
        </label>

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <Button
          className="h-12 rounded-2xl"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending OTP..." : "Send OTP"}
        </Button>
      </div>
    </div>
  );
}
