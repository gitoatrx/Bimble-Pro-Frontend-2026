"use client";

import { useEffect, useState } from "react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicCredentialsCard } from "@/components/clinic-access/clinic-credentials-card";
import { clearClinicSessionState, readStoredClinicCredentials } from "@/lib/clinic/session";
import { submitClinicLogin } from "@/lib/api/clinic";
import type { ClinicCredentials } from "@/lib/clinic/types";

const emptyCredentials: ClinicCredentials = {
  clinicName: "",
  username: "",
  password: "",
  pin: "",
};

const loginStepTitle = "Clinic Login";

export default function ClinicLoginPage() {
  const [credentials, setCredentials] =
    useState<ClinicCredentials>(emptyCredentials);
  const [hasLoadedCredentials, setHasLoadedCredentials] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const storedCredentials = readStoredClinicCredentials();

    if (storedCredentials) {
      setCredentials(storedCredentials);
    }

    setHasLoadedCredentials(true);
  }, []);

  function updateCredentialField(
    field: "clinicName" | "username" | "password" | "pin",
    value: string,
  ) {
    setCredentials((current) => ({ ...current, [field]: value }));
    setLoginError("");
  }

  async function handleGoToLogin() {
    setIsLoggingIn(true);
    setLoginError("");

    try {
      const loginResponse = await submitClinicLogin(credentials);
      const redirectUrl = loginResponse.bootstrapUrl || loginResponse.appUrl;

      if (!redirectUrl) {
        throw new Error(
          "Clinic login succeeded, but no redirect URL was returned.",
        );
      }

      clearClinicSessionState();
      window.location.assign(redirectUrl);
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "We could not log the clinic in right now. Please try again.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }

  if (!hasLoadedCredentials) {
    return (
      <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm leading-6 text-slate-600">
            Loading clinic login details...
          </p>
        </div>
      </ClinicFlowShell>
    );
  }

  return (
    <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
      <div className="mb-6 max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {loginStepTitle}
        </h1>
      </div>

      <ClinicCredentialsCard
        credentials={credentials}
        isLoggingIn={isLoggingIn}
        loginError={loginError}
        onBack={() => {
          window.location.assign("/onboarding/plan");
        }}
        onLogin={() => {
          void handleGoToLogin();
        }}
        onCredentialsChange={updateCredentialField}
      />
    </ClinicFlowShell>
  );
}
