"use client";

import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ClinicLoginFormData } from "@/lib/clinic/types";

type ClinicCredentialsCardProps = {
  formData: ClinicLoginFormData;
  isLoggingIn?: boolean;
  loginError?: string;
  onLogin: () => void;
  onFieldChange: (field: keyof ClinicLoginFormData, value: string) => void;
};

const neutralFieldClassName =
  "h-12 !border-border !bg-white !text-foreground !shadow-none focus-visible:ring-primary/20";

export function ClinicCredentialsCard({
  formData,
  isLoggingIn = false,
  loginError,
  onLogin,
  onFieldChange,
}: ClinicCredentialsCardProps) {
  const [showPassword, setShowPassword] = useState(false);

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
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="admin@yourclinic.com"
            value={formData.email}
            onChange={(event) => onFieldChange("email", event.target.value)}
            autoComplete="email"
            className={neutralFieldClassName}
            autoFocus
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
      </div>

      <FieldError message={loginError} />

      <Button
        type="submit"
        className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
        disabled={isLoggingIn}
      >
        {isLoggingIn ? "Sending verification code..." : "Continue"}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
