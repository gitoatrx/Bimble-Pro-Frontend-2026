"use client";

import { useState } from "react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicCredentialsCard } from "@/components/clinic-access/clinic-credentials-card";
import { submitClinicLogin } from "@/lib/api/clinic";
import { clearClinicSessionState } from "@/lib/clinic/session";
import type { ClinicLoginFormData } from "@/lib/clinic/types";

const emptyForm: ClinicLoginFormData = {
  clinicSlug: "",
  pin: "",
  username: "",
  password: "",
};

export default function ClinicLoginPage() {
  const [formData, setFormData] = useState<ClinicLoginFormData>(emptyForm);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  function updateField(field: keyof ClinicLoginFormData, value: string) {
    setFormData((current) => ({ ...current, [field]: value }));
    setLoginError("");
  }

  async function handleLogin() {
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await submitClinicLogin(formData);
      clearClinicSessionState();

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("bimble:clinic:name", response.clinic_slug);
        window.sessionStorage.setItem("bimble:clinic:token", response.access_token);
      }

      window.location.assign(response.app_url);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials and try again.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
      <div className="mb-6 max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Clinic Login
        </h1>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Enter your clinic name, PIN, and credentials to sign in.
        </p>
      </div>

      <ClinicCredentialsCard
        formData={formData}
        isLoggingIn={isLoggingIn}
        loginError={loginError}
        onBack={() => window.location.assign("/onboarding/plan")}
        onLogin={() => void handleLogin()}
        onFieldChange={updateField}
      />
    </ClinicFlowShell>
  );
}
