"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClinicLoginFormData } from "@/lib/clinic/types";

type ClinicCredentialsCardProps = {
  formData: ClinicLoginFormData;
  isLoggingIn?: boolean;
  loginError?: string;
  onBack: () => void;
  onLogin: () => void;
  onFieldChange: (field: keyof ClinicLoginFormData, value: string) => void;
};

const neutralFieldClassName =
  "h-12 !border-border !bg-white !text-foreground !shadow-none focus-visible:ring-primary/20";

export function ClinicCredentialsCard({
  formData,
  isLoggingIn = false,
  loginError,
  onBack,
  onLogin,
  onFieldChange,
}: ClinicCredentialsCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  return (
    <form
      className="max-w-xl space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLoggingIn) {
          onLogin();
        }
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="clinicSlug"
            className="block text-sm font-medium text-foreground"
          >
            Clinic Name
          </label>
          <Input
            id="clinicSlug"
            placeholder="DR Ortho"
            value={formData.clinicSlug}
            onChange={(event) => onFieldChange("clinicSlug", event.target.value)}
            autoComplete="organization"
            className={neutralFieldClassName}
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-foreground"
          >
            Username
          </label>
          <Input
            id="username"
            value={formData.username}
            onChange={(event) => onFieldChange("username", event.target.value)}
            autoComplete="username"
            className={neutralFieldClassName}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary/80"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(event) => onFieldChange("password", event.target.value)}
            autoComplete="current-password"
            className={neutralFieldClassName}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="pin"
              className="block text-sm font-medium text-foreground"
            >
              PIN
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary/80"
              onClick={() => setShowPin((current) => !current)}
            >
              {showPin ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showPin ? "Hide" : "Show"}
            </Button>
          </div>
          <Input
            id="pin"
            type={showPin ? "text" : "password"}
            value={formData.pin}
            onChange={(event) => onFieldChange("pin", event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="1234"
            className={neutralFieldClassName}
          />
        </div>
      </div>

      <FieldError message={loginError} />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-12 sm:min-w-36"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          type="submit"
          className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Logging in..." : "Login"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
