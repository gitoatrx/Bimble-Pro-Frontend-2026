"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { GooglePlacesAddressInput } from "@/components/clinic-access/google-places-address-input";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitClinicLogin, submitClinicOnboarding } from "@/lib/api/clinic";
import {
  clinicTypeOptions,
  formatPhoneNumber,
  formatPostalCode,
  initialClinicOnboardingFormData,
  onboardingStepOrder,
  provinceOptions,
  validateClinicOnboardingStep,
} from "@/lib/clinic/onboarding";
import type {
  ClinicAddressSelection,
  ClinicCredentials,
  ClinicOnboardingFormData,
  FieldErrors,
  OnboardingStepKey,
} from "@/lib/clinic/types";

const onboardingStepTitles: Record<OnboardingStepKey, string> = {
  clinic: "Set up your clinic",
  location: "Add clinic location",
  operations: "Add contact details",
};

const onboardingStepHelpers: Record<OnboardingStepKey, string> = {
  clinic: "Enter the clinic identity details.",
  location: "Add the clinic address and postal code.",
  operations: "Finish with the contact and service details.",
};

const neutralFieldClassName =
  "h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20";

const neutralTextareaClassName =
  "min-h-28 resize-none !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20";

const neutralSelectClassName =
  "flex h-12 w-full rounded-md !border !border-slate-200 !bg-white px-3 py-2 text-sm text-slate-900 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/20";

export default function ClinicOnboardingPage() {
  const [step, setStep] = useState<OnboardingStepKey>("clinic");
  const [formData, setFormData] = useState<ClinicOnboardingFormData>(
    initialClinicOnboardingFormData,
  );
  const [errors, setErrors] = useState<FieldErrors<ClinicOnboardingFormData>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [credentials, setCredentials] = useState<ClinicCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  function setField<K extends keyof ClinicOnboardingFormData>(
    field: K,
    value: ClinicOnboardingFormData[K],
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitError("");
    setLoginError("");
  }

  function getStepIndex(currentStep: OnboardingStepKey) {
    return onboardingStepOrder.indexOf(currentStep);
  }

  function handleBack() {
    const currentStepIndex = getStepIndex(step);

    if (currentStepIndex <= 0) {
      return;
    }

    setStep(onboardingStepOrder[currentStepIndex - 1]);
  }

  function handleAddressSelected(selection: ClinicAddressSelection) {
    setFormData((current) => ({
      ...current,
      address: selection.address || current.address,
      city: selection.city || current.city,
      province: selection.province || current.province,
      postalCode: selection.postalCode
        ? formatPostalCode(selection.postalCode)
        : current.postalCode,
    }));
    setErrors((current) => ({
      ...current,
      address: "",
      city: "",
      province: "",
      postalCode: "",
    }));
    setSubmitError("");
    setLoginError("");
  }

  async function handleGoToLogin() {
    if (!credentials) {
      return;
    }

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const loginResponse = await submitClinicLogin(credentials);
      const redirectUrl = loginResponse.bootstrapUrl || loginResponse.appUrl;

      if (!redirectUrl) {
        throw new Error("Clinic login succeeded, but no redirect URL was returned.");
      }

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

  async function handleContinue() {
    const nextErrors = validateClinicOnboardingStep(step, formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const currentStepIndex = getStepIndex(step);
    const isFinalStep = currentStepIndex === onboardingStepOrder.length - 1;

    if (!isFinalStep) {
      setStep(onboardingStepOrder[currentStepIndex + 1]);
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const nextCredentials = await submitClinicOnboarding(formData);
      setShowPassword(false);
      setShowPin(false);
      setCredentials(nextCredentials);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not generate clinic credentials right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStepFields() {
    if (step === "clinic") {
      return (
        <>
          <div>
            <label
              htmlFor="clinicLegalName"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Clinic Legal Name
            </label>
            <Input
              id="clinicLegalName"
              placeholder="Bimble Health Services Ltd."
              value={formData.clinicLegalName}
              onChange={(event) =>
                setField("clinicLegalName", event.target.value)
              }
              className={neutralFieldClassName}
              autoFocus
            />
            <FieldError message={errors.clinicLegalName} />
          </div>

          <div>
            <label
              htmlFor="clinicDisplayName"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Clinic Display Name
            </label>
            <Input
              id="clinicDisplayName"
              placeholder="Bimble Downtown Clinic"
              value={formData.clinicDisplayName}
              onChange={(event) =>
                setField("clinicDisplayName", event.target.value)
              }
              className={neutralFieldClassName}
            />
            <FieldError message={errors.clinicDisplayName} />
          </div>

          <div>
            <label
              htmlFor="establishedYear"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Establish Year
            </label>
            <Input
              id="establishedYear"
              type="number"
              inputMode="numeric"
              placeholder="2016"
              value={formData.establishedYear}
              onChange={(event) =>
                setField(
                  "establishedYear",
                  event.target.value.replace(/\D/g, "").slice(0, 4),
                )
              }
              className={neutralFieldClassName}
            />
            <FieldError message={errors.establishedYear} />
          </div>
        </>
      );
    }

    if (step === "location") {
      return (
        <>
          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Address
            </label>
            <GooglePlacesAddressInput
              id="address"
              placeholder="Enter the full clinic address"
              value={formData.address}
              onChange={(value) => setField("address", value)}
              onAddressSelected={handleAddressSelected}
              autoFocus
            />
            <FieldError message={errors.address} />
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              City
            </label>
            <Input
              id="city"
              placeholder="Vancouver"
              value={formData.city}
              onChange={(event) => setField("city", event.target.value)}
              className={neutralFieldClassName}
            />
            <FieldError message={errors.city} />
          </div>

          <div>
            <label
              htmlFor="province"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Province
            </label>
            <select
              id="province"
              value={formData.province}
              onChange={(event) => setField("province", event.target.value)}
              className={neutralSelectClassName}
            >
              <option value="">Select province</option>
              {provinceOptions.map((province) => (
                <option key={province} value={province}>
                  {province}
                </option>
              ))}
            </select>
            <FieldError message={errors.province} />
          </div>

          <div>
            <label
              htmlFor="postalCode"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Postal Code
            </label>
            <Input
              id="postalCode"
              placeholder="V6B 1A1"
              value={formData.postalCode}
              onChange={(event) =>
                setField("postalCode", formatPostalCode(event.target.value))
              }
              className={neutralFieldClassName}
            />
            <FieldError message={errors.postalCode} />
          </div>
        </>
      );
    }

    return (
      <>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="clinic@bimble.health"
            value={formData.email}
            onChange={(event) => setField("email", event.target.value)}
            className={neutralFieldClassName}
            autoFocus
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Phone Number
          </label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="604 555 0142"
            value={formData.phoneNumber}
            onChange={(event) =>
              setField("phoneNumber", formatPhoneNumber(event.target.value))
            }
            className={neutralFieldClassName}
          />
          <FieldError message={errors.phoneNumber} />
        </div>

        <div>
          <label
            htmlFor="clinicType"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Type of Clinic
          </label>
          <select
            id="clinicType"
            value={formData.clinicType}
            onChange={(event) => setField("clinicType", event.target.value)}
            className={neutralSelectClassName}
          >
            <option value="">Select clinic type</option>
            {clinicTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError message={errors.clinicType} />
        </div>

        <div>
          <label
            htmlFor="servicesProvided"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Service Provided
          </label>
          <Textarea
            id="servicesProvided"
            placeholder="Describe the services provided by the clinic"
            value={formData.servicesProvided}
            onChange={(event) =>
              setField("servicesProvided", event.target.value)
            }
            className={neutralTextareaClassName}
          />
          <FieldError message={errors.servicesProvided} />
        </div>
      </>
    );
  }

  function renderCredentialsCard() {
    if (!credentials) {
      return null;
    }

    return (
      <div className="max-w-xl space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Clinic Name
            </label>
            <Input
              value={credentials.clinicName}
              readOnly
              className={neutralFieldClassName}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-900">
              Username
            </label>
            <Input
              value={credentials.username}
              readOnly
              className={neutralFieldClassName}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-slate-900">
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
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              readOnly
              className={neutralFieldClassName}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-slate-900">
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
              type={showPin ? "text" : "password"}
              value={credentials.pin}
              readOnly
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
            onClick={() => {
              setShowPassword(false);
              setShowPin(false);
              setCredentials(null);
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            type="button"
            className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              void handleGoToLogin();
            }}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Logging in..." : "Login"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const isFirstStep = step === onboardingStepOrder[0];
  const isFinalStep = step === onboardingStepOrder[onboardingStepOrder.length - 1];
  const activeStepIndex = credentials
    ? onboardingStepOrder.length - 1
    : getStepIndex(step);
  const progressWidth = `${((activeStepIndex + 1) / onboardingStepOrder.length) * 100}%`;
  const currentStepTitle = credentials
    ? "Clinic access"
    : onboardingStepTitles[step];
  const currentStepHelper = credentials
    ? "Review the generated login details."
    : onboardingStepHelpers[step];

  return (
    <ClinicFlowShell backHref="/" backLabel="Back to home">
      <div className="mb-6 max-w-xl space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {currentStepTitle}
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            {currentStepHelper}
          </p>
        </div>

        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: progressWidth }}
          />
        </div>
      </div>

      {credentials ? (
        renderCredentialsCard()
      ) : (
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void handleContinue();
            }}
          >
            {renderStepFields()}

            <FieldError message={submitError} />

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              {!isFirstStep ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 sm:min-w-32"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : null}

              <Button
                type="submit"
                className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isFinalStep ? (
                  isSubmitting ? (
                    "Submitting..."
                  ) : (
                    "Submit onboarding"
                  )
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </ClinicFlowShell>
  );
}
