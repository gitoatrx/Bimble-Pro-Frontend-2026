"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { GooglePlacesAddressInput } from "@/components/clinic-access/google-places-address-input";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitClinicOnboarding } from "@/lib/api/clinic";
import {
  readClinicOnboardingState,
  readClinicSelectedPlan,
  storeClinicOnboardingState,
  storeClinicSignupResult,
} from "@/lib/clinic/session";
import {
  clinicTypeOptions,
  capitalizeWordsInput,
  formatPhoneNumber,
  formatPostalCode,
  initialClinicOnboardingFormData,
  normalizeCityNameInput,
  normalizeClinicOnboardingFormData,
  normalizeClinicTextInput,
  normalizeServicesInput,
  onboardingStepOrder,
  validateClinicOnboardingStep,
} from "@/lib/clinic/onboarding";
import type {
  ClinicAddressSelection,
  ClinicOnboardingFormData,
  ClinicPlan,
  FieldErrors,
  OnboardingStepKey,
} from "@/lib/clinic/types";

const onboardingStepTitles: Record<OnboardingStepKey, string> = {
  clinic: "Set up your clinic",
  location: "Add clinic location",
  operations: "Add contact details",
  credentials: "Set your credentials",
};

const onboardingStepHelpers: Record<OnboardingStepKey, string> = {
  clinic: "Enter the clinic identity details.",
  location: "Add the clinic address and postal code.",
  operations: "Finish with the contact and service details.",
  credentials: "Create your admin password and 4-digit PIN for Bimble and OSCAR.",
};

const neutralFieldClassName =
  "h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20";

const neutralTextareaClassName =
  "min-h-28 resize-none !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20";

const neutralSelectClassName =
  "flex h-12 w-full rounded-md !border !border-slate-200 !bg-white px-3 py-2 text-sm text-slate-900 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/20";

const invalidFieldClassName =
  "!border-destructive/60 focus-visible:ring-destructive/20";

export default function ClinicOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStepKey>("clinic");
  const [formData, setFormData] = useState<ClinicOnboardingFormData>(
    initialClinicOnboardingFormData,
  );
  const [errors, setErrors] = useState<FieldErrors<ClinicOnboardingFormData>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ClinicPlan | null>(null);
  const [isFlowReady, setIsFlowReady] = useState(false);

  useEffect(() => {
    const storedPlan = readClinicSelectedPlan();

    if (!storedPlan) {
      window.location.replace("/onboarding/plan");
      return;
    }

    setSelectedPlan(storedPlan);

    const storedState = readClinicOnboardingState();

    if (!storedState) {
      setIsFlowReady(true);
      return;
    }

    setStep(storedState.step);
    setFormData(storedState.formData);
    setIsFlowReady(true);
  }, []);

  useEffect(() => {
    if (!isFlowReady) {
      return;
    }

    storeClinicOnboardingState({
      step,
      formData,
    });
  }, [formData, isFlowReady, step]);

  function getFieldClassName(field: keyof ClinicOnboardingFormData) {
    return `${neutralFieldClassName} ${errors[field] ? invalidFieldClassName : ""}`;
  }

  function getTextareaClassName(field: keyof ClinicOnboardingFormData) {
    return `${neutralTextareaClassName} ${errors[field] ? invalidFieldClassName : ""}`;
  }

  function normalizeFieldValue<K extends keyof ClinicOnboardingFormData>(
    field: K,
    value: ClinicOnboardingFormData[K],
  ): ClinicOnboardingFormData[K] {
    if (typeof value !== "string") {
      return value;
    }

    const normalizers: Partial<
      Record<keyof ClinicOnboardingFormData, (raw: string) => string>
    > = {
      clinicLegalName: normalizeClinicTextInput,
      clinicDisplayName: normalizeClinicTextInput,
      address: capitalizeWordsInput,
      city: normalizeCityNameInput,
      province: capitalizeWordsInput,
      postalCode: formatPostalCode,
      email: (raw) => raw.trimStart().toLowerCase(),
      phoneNumber: formatPhoneNumber,
      servicesProvided: normalizeServicesInput,
      pin: (raw) => raw.replace(/\D/g, "").slice(0, 4),
    };

    return (normalizers[field]?.(value) ?? value) as ClinicOnboardingFormData[K];
  }

  function setField<K extends keyof ClinicOnboardingFormData>(
    field: K,
    value: ClinicOnboardingFormData[K],
  ) {
    const nextValue = normalizeFieldValue(field, value);
    const nextFormData = { ...formData, [field]: nextValue };
    const nextFieldErrors = validateClinicOnboardingStep(step, nextFormData);

    setFormData(nextFormData);
    setErrors((currentErrors) => {
      const nextErrors = {
        ...currentErrors,
        [field]: nextFieldErrors[field] ?? "",
      };

      if (field === "password" || field === "confirmPassword") {
        nextErrors.confirmPassword = nextFieldErrors.confirmPassword ?? "";
      }

      return nextErrors;
    });
    setSubmitError("");
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
  }

  async function handleContinue() {
    const normalizedFormData = normalizeClinicOnboardingFormData(formData);
    setFormData(normalizedFormData);

    const nextErrors = validateClinicOnboardingStep(step, normalizedFormData);
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
      if (!selectedPlan) {
        throw new Error("No plan selected. Please go back and choose a plan.");
      }

      const signupResult = await submitClinicOnboarding(
        normalizedFormData,
        selectedPlan.id,
      );
      storeClinicSignupResult(signupResult);

      // Redirect to Stripe checkout for payment.
      // Stripe will redirect back to /onboarding/billing?success=1 on completion
      // or /onboarding/billing?cancelled=1 if the user cancels.
      if (signupResult.stripeCheckoutUrl) {
        window.location.assign(signupResult.stripeCheckoutUrl);
      } else {
        // No Stripe URL (mock/dev mode) — go straight to billing confirmation
        router.push(
          `/onboarding/billing?success=1&clinic_id=${encodeURIComponent(String(signupResult.clinicId))}&clinic_code=${encodeURIComponent(signupResult.clinicCode)}`,
        );
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not complete registration right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStepFields() {
    if (step === "credentials") {
      return (
        <>
          <p className="text-sm text-slate-500">
            These credentials are used to sign in to your Bimble dashboard and
            OSCAR EMR. Keep them safe — they cannot be recovered.
          </p>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(event) => setField("password", event.target.value)}
                className={`${getFieldClassName("password")} pr-10`}
                aria-invalid={Boolean(errors.password)}
                autoFocus
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={errors.password} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(event) =>
                  setField("confirmPassword", event.target.value)
                }
                className={`${getFieldClassName("confirmPassword")} pr-10`}
                aria-invalid={Boolean(errors.confirmPassword)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={errors.confirmPassword} />
          </div>

          <div>
            <label
              htmlFor="pin"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              4-digit PIN
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Used as a secondary access code inside OSCAR EMR.
            </p>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                placeholder="••••"
                maxLength={4}
                value={formData.pin}
                onChange={(event) =>
                  setField("pin", event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className={`${getFieldClassName("pin")} pr-10 tracking-[0.35em]`}
                aria-invalid={Boolean(errors.pin)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={errors.pin} />
          </div>
        </>
      );
    }

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
              className={getFieldClassName("clinicLegalName")}
              aria-invalid={Boolean(errors.clinicLegalName)}
              autoFocus
              autoCapitalize="words"
              autoComplete="organization"
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
              className={getFieldClassName("clinicDisplayName")}
              aria-invalid={Boolean(errors.clinicDisplayName)}
              autoCapitalize="words"
              autoComplete="organization"
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
              className={getFieldClassName("establishedYear")}
              aria-invalid={Boolean(errors.establishedYear)}
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
              hasError={Boolean(errors.address)}
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
              className={getFieldClassName("city")}
              aria-invalid={Boolean(errors.city)}
              autoCapitalize="words"
              autoComplete="address-level2"
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
            <Input
              id="province"
              placeholder="BC"
              value={formData.province}
              onChange={(event) => setField("province", event.target.value)}
              className={getFieldClassName("province")}
              aria-invalid={Boolean(errors.province)}
              autoCapitalize="words"
              autoComplete="address-level1"
            />
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
              className={getFieldClassName("postalCode")}
              aria-invalid={Boolean(errors.postalCode)}
              autoCapitalize="characters"
              autoComplete="postal-code"
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
            className={getFieldClassName("email")}
            aria-invalid={Boolean(errors.email)}
            autoFocus
            autoCapitalize="none"
            autoComplete="email"
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
            className={getFieldClassName("phoneNumber")}
            aria-invalid={Boolean(errors.phoneNumber)}
            autoComplete="tel"
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
            className={`${neutralSelectClassName} ${
              errors.clinicType ? invalidFieldClassName : ""
            }`}
            aria-invalid={Boolean(errors.clinicType)}
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
            className={getTextareaClassName("servicesProvided")}
            aria-invalid={Boolean(errors.servicesProvided)}
            autoCapitalize="sentences"
          />
          <FieldError message={errors.servicesProvided} />
        </div>
      </>
    );
  }

  const isFirstStep = step === onboardingStepOrder[0];
  const isFinalStep = step === onboardingStepOrder[onboardingStepOrder.length - 1];
  const activeStepIndex = getStepIndex(step);
  const progressWidth = `${((activeStepIndex + 1) / onboardingStepOrder.length) * 100}%`;
  const currentStepTitle = onboardingStepTitles[step];
  const currentStepHelper = onboardingStepHelpers[step];

  if (!isFlowReady) {
    return (
      <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm leading-6 text-slate-600">
            Preparing clinic setup...
          </p>
        </div>
      </ClinicFlowShell>
    );
  }

  return (
    <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
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

        {selectedPlan ? (
          <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              Plan: {selectedPlan.name}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              {selectedPlan.trialDays}-day trial active
            </span>
          </div>
        ) : null}
      </div>

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
                  "Registering clinic..."
                ) : (
                  "Register & continue to payment"
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
    </ClinicFlowShell>
  );
}
