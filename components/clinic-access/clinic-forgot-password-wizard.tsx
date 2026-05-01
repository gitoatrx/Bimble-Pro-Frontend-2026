"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  requestForgotPasswordOtp,
  resetForgotPassword,
  verifyForgotPasswordOtp,
} from "@/lib/api/password-reset";
import type { ForgotPasswordAccountType } from "@/lib/auth/password-reset";

type ForgotPasswordStep = "email" | "otp" | "reset";

type ClinicForgotPasswordWizardProps = {
  initialEmail?: string;
  onCancel: () => void;
  onSuccess: (message: string) => void;
  accountType?: ForgotPasswordAccountType;
};

const neutralFieldClassName =
  "h-12 !border-border !bg-white !text-foreground !shadow-none focus-visible:ring-primary/20";

export function ClinicForgotPasswordWizard({
  initialEmail = "",
  onCancel,
  onSuccess,
  accountType = "clinic",
}: ClinicForgotPasswordWizardProps) {
  const [step, setStep] = useState<ForgotPasswordStep>("email");
  const [email, setEmail] = useState(initialEmail);
  const [resetToken, setResetToken] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  function resetLocalState() {
    setStep("email");
    setResetToken("");
    setMaskedEmail("");
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError("");
    setIsSubmitting(false);
  }

  async function handleRequestCode() {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await requestForgotPasswordOtp({
        email: trimmed,
        account_type: accountType,
      });

      setResetToken(response.reset_token);
      setMaskedEmail(response.masked_email);
      setOtpCode("");
      setStep("otp");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not send the reset code. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (otpCode.trim().length !== 8) {
      setError("Enter the 8-digit reset code.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await verifyForgotPasswordOtp({
        reset_token: resetToken,
        otp_code: otpCode.trim(),
      });

      if (!response.verified) {
        setError("The code could not be verified. Please try again.");
        return;
      }

      setStep("reset");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Verification failed. Please check your code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please enter and confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await resetForgotPassword({
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      onSuccess(response.message || "Password reset successful.");
      resetLocalState();
      onCancel();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reset the password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (step === "email") {
      resetLocalState();
      onCancel();
      return;
    }

    if (step === "otp") {
      setStep("email");
      setError("");
      setOtpCode("");
      return;
    }

    setStep("otp");
    setError("");
  }

  return (
    <div className="max-w-xl space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          {step === "email"
            ? "Reset your password"
            : step === "otp"
              ? "Check your email"
              : "Create a new password"}
        </h2>
      </div>

      {error && <FieldError message={error} />}

      {step === "email" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="reset-email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="reset-email"
              type="email"
              placeholder="admin@yourclinic.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
              autoComplete="email"
              className={neutralFieldClassName}
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
              onClick={() => void handleRequestCode()}
            >
              {isSubmitting ? "Sending code..." : "Send reset code"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 text-muted-foreground hover:text-foreground"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === "otp" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="reset-otp" className="block text-sm font-medium text-foreground">
              Reset code
            </label>
            {maskedEmail ? (
              <p className="text-sm text-muted-foreground">
                We sent the reset code to {maskedEmail}.
              </p>
            ) : null}
            <Input
              id="reset-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="12345678"
              value={otpCode}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "").slice(0, 8);
                setOtpCode(digits);
                setError("");
              }}
              className={neutralFieldClassName}
              maxLength={8}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting || otpCode.length !== 8}
              onClick={() => void handleVerifyCode()}
            >
              {isSubmitting ? "Verifying..." : "Verify code"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 text-muted-foreground hover:text-foreground"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      )}

      {step === "reset" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setError("");
                }}
                placeholder="Enter a strong password"
                autoComplete="new-password"
                className={`${neutralFieldClassName} pr-20`}
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute right-2 top-1/2 h-8 -translate-y-1/2 px-2 text-primary hover:bg-transparent hover:text-primary/80"
                onClick={() => setShowNewPassword((current) => !current)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showNewPassword ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">
              Confirm password
            </label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError("");
                }}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={`${neutralFieldClassName} pr-20`}
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute right-2 top-1/2 h-8 -translate-y-1/2 px-2 text-primary hover:bg-transparent hover:text-primary/80"
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showConfirmPassword ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              className="h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting || !newPassword.trim() || !confirmPassword.trim()}
              onClick={() => void handleResetPassword()}
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12 px-4 text-muted-foreground hover:text-foreground"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
