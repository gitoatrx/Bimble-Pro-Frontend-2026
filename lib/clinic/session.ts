import type {
  ClinicLoginSession,
  ClinicOnboardingFormData,
  ClinicPlan,
  ClinicSignupResult,
  OnboardingStepKey,
} from "@/lib/clinic/types";

const CLINIC_ONBOARDING_STATE_KEY = "bimble:clinic:onboarding-state";
const CLINIC_SELECTED_PLAN_KEY = "bimble:clinic:selected-plan";
const CLINIC_SIGNUP_RESULT_KEY = "bimble:clinic:signup-result";
const CLINIC_LOGIN_SESSION_KEY = "bimble:clinic:login-session";

export type StoredClinicOnboardingState = {
  step: OnboardingStepKey;
  formData: ClinicOnboardingFormData;
};

export type ClinicLoginPrefill = Partial<{
  clinicSlug: string;
  username: string;
  password: string;
  pin: string;
}>;

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

function firstString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function isClinicLoginSession(value: unknown): value is ClinicLoginSession {
  return (
    isRecord(value) &&
    typeof value.clinicSlug === "string" &&
    typeof value.accessToken === "string" &&
    typeof value.appUrl === "string"
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

function readPersistentValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writePersistentValue(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removePersistentValue(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(key);
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

export function readClinicLoginPrefillFromSignup() {
  const signupResult = readClinicSignupResult();

  if (!signupResult) {
    return null;
  }

  const prefill: ClinicLoginPrefill = {};

  const clinicSlug = firstString(
    signupResult.clinicName,
    signupResult.slug,
    signupResult.clinicCode,
  );

  const username = firstString(signupResult.username);
  const password = firstString(
    signupResult.password,
    signupResult.tempPassword,
  );
  const pin = firstString(signupResult.pin, signupResult.tempPin);

  if (clinicSlug) {
    prefill.clinicSlug = clinicSlug;
  }

  if (username) {
    prefill.username = username;
  }

  if (password) {
    prefill.password = password;
  }

  if (pin) {
    prefill.pin = pin;
  }

  return Object.keys(prefill).length > 0 ? prefill : null;
}

export function storeClinicLoginSession(session: ClinicLoginSession) {
  writePersistentValue(CLINIC_LOGIN_SESSION_KEY, session);
}

export function readClinicLoginSession() {
  const raw = readPersistentValue(CLINIC_LOGIN_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isClinicLoginSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearClinicLoginSession() {
  removePersistentValue(CLINIC_LOGIN_SESSION_KEY);
}

export function clearClinicSessionState() {
  removeSessionValue(CLINIC_ONBOARDING_STATE_KEY);
  removeSessionValue(CLINIC_SELECTED_PLAN_KEY);
  removeSessionValue(CLINIC_SIGNUP_RESULT_KEY);
  removePersistentValue(CLINIC_LOGIN_SESSION_KEY);
}
