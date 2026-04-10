"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClinicCredentials } from "@/lib/clinic/types";

type ClinicLoginField = "clinicName" | "username" | "password" | "pin";

type ClinicCredentialsCardProps = {
  credentials: ClinicCredentials;
  isLoggingIn?: boolean;
  loginError?: string;
  onBack: () => void;
  onLogin: () => void;
  onCredentialsChange: (field: ClinicLoginField, value: string) => void;
};

const neutralFieldClassName =
  "h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20";

export function ClinicCredentialsCard({
  credentials,
  isLoggingIn = false,
  loginError,
  onBack,
  onLogin,
  onCredentialsChange,
}: ClinicCredentialsCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  return (
    <form
      className="max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isLoggingIn) {
          onLogin();
        }
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="clinicName" className="block text-sm font-medium text-slate-900">
            Clinic Name
          </label>
          <Input
            id="clinicName"
            value={credentials.clinicName}
            onChange={(event) =>
              onCredentialsChange("clinicName", event.target.value)
            }
            autoComplete="organization"
            className={neutralFieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-slate-900">
            Username
          </label>
          <Input
            id="username"
            value={credentials.username}
            onChange={(event) =>
              onCredentialsChange("username", event.target.value)
            }
            autoComplete="username"
            className={neutralFieldClassName}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="block text-sm font-medium text-slate-900">
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
            value={credentials.password}
            onChange={(event) =>
              onCredentialsChange("password", event.target.value)
            }
            autoComplete="current-password"
            className={neutralFieldClassName}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="pin" className="block text-sm font-medium text-slate-900">
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
            value={credentials.pin}
            inputMode="numeric"
            maxLength={4}
            onChange={(event) =>
              onCredentialsChange(
                "pin",
                event.target.value.replace(/\D/g, "").slice(0, 4),
              )
            }
            autoComplete="one-time-code"
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
          type="button"
          className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            onLogin();
          }}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? "Logging in..." : "Login"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
