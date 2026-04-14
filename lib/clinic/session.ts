import type {
  ClinicOnboardingFormData,
  ClinicPlan,
  ClinicSignupResult,
  OnboardingStepKey,
} from "@/lib/clinic/types";

const CLINIC_ONBOARDING_STATE_KEY = "bimble:clinic:onboarding-state";
const CLINIC_SELECTED_PLAN_KEY = "bimble:clinic:selected-plan";
const CLINIC_SIGNUP_RESULT_KEY = "bimble:clinic:signup-result";

export type StoredClinicOnboardingState = {
  step: OnboardingStepKey;
  formData: ClinicOnboardingFormData;
};

function isOnboardingStepKey(value: unknown): value is OnboardingStepKey {
  return value === "clinic" || value === "location" || value === "operations";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isClinicPlan(value: unknown): value is ClinicPlan {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.trim().length > 0 &&
    typeof value.name === "string" &&
    typeof value.subtitle === "string" &&
    typeof value.priceLabel === "string" &&
    typeof value.billingInterval === "string" &&
    typeof value.trialDays === "number" &&
    typeof value.monthlyPriceCents === "number" &&
    Array.isArray(value.features) &&
    value.features.every((feature) => typeof feature === "string") &&
    (value.recommended === undefined || typeof value.recommended === "boolean")
  );
}

function isClinicOnboardingFormData(
  value: unknown,
): value is ClinicOnboardingFormData {
  return (
    isRecord(value) &&
    typeof value.clinicLegalName === "string" &&
    typeof value.clinicDisplayName === "string" &&
    typeof value.establishedYear === "string" &&
    typeof value.address === "string" &&
    typeof value.city === "string" &&
    typeof value.province === "string" &&
    typeof value.postalCode === "string" &&
    typeof value.email === "string" &&
    typeof value.phoneNumber === "string" &&
    typeof value.clinicType === "string" &&
    typeof value.servicesProvided === "string"
  );
}

function isClinicSignupResult(value: unknown): value is ClinicSignupResult {
  return (
    isRecord(value) &&
    typeof value.clinicId === "number" &&
    typeof value.clinicCode === "string" &&
    typeof value.slug === "string" &&
    typeof value.stripeCheckoutUrl === "string" &&
    typeof value.message === "string"
  );
}

function isStoredClinicOnboardingState(
  value: unknown,
): value is StoredClinicOnboardingState {
  return (
    isRecord(value) &&
    isOnboardingStepKey(value.step) &&
    isClinicOnboardingFormData(value.formData)
  );
}

function readSessionValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(key);
}

function writeSessionValue(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function removeSessionValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(key);
}

export function storeClinicOnboardingState(state: StoredClinicOnboardingState) {
  writeSessionValue(CLINIC_ONBOARDING_STATE_KEY, state);
}

export function readClinicOnboardingState() {
  const rawState = readSessionValue(CLINIC_ONBOARDING_STATE_KEY);

  if (!rawState) {
    return null;
  }

  try {
    const parsedState: unknown = JSON.parse(rawState);
    return isStoredClinicOnboardingState(parsedState) ? parsedState : null;
  } catch {
    return null;
  }
}

export function storeClinicSelectedPlan(plan: ClinicPlan) {
  writeSessionValue(CLINIC_SELECTED_PLAN_KEY, plan);
}

export function readClinicSelectedPlan() {
  const rawPlan = readSessionValue(CLINIC_SELECTED_PLAN_KEY);

  if (!rawPlan) {
    return null;
  }

  try {
    const parsedPlan: unknown = JSON.parse(rawPlan);
    return isClinicPlan(parsedPlan) ? parsedPlan : null;
  } catch {
    return null;
  }
}

export function storeClinicSignupResult(result: ClinicSignupResult) {
  writeSessionValue(CLINIC_SIGNUP_RESULT_KEY, result);
}

export function readClinicSignupResult() {
  const raw = readSessionValue(CLINIC_SIGNUP_RESULT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isClinicSignupResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearClinicSessionState() {
  removeSessionValue(CLINIC_ONBOARDING_STATE_KEY);
  removeSessionValue(CLINIC_SELECTED_PLAN_KEY);
  removeSessionValue(CLINIC_SIGNUP_RESULT_KEY);
}
