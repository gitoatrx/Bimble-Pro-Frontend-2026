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
export const CLINIC_LOGIN_SESSION_KEY = "bimble:clinic:login-session";
export const CLINIC_ONBOARDING_COMPLETE_KEY = "bimble:clinic:onboarding-complete";

export type StoredClinicOnboardingState = {
  step: OnboardingStepKey;
  formData: ClinicOnboardingFormData;
};

export type ClinicLoginPrefill = Partial<{
  email: string;
  password: string;
}>;

function decodeJwtExpiryIso(token: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    const [, payloadPart] = token.split(".");
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = window.atob(padded);
    const payload = JSON.parse(decoded) as { exp?: number };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) {
      return null;
    }
    return new Date(payload.exp * 1000).toISOString();
  } catch {
    return null;
  }
}

function isExpired(expiresAt: string | undefined): boolean {
  if (!expiresAt) return false;
  const expiresMs = Date.parse(expiresAt);
  return Number.isFinite(expiresMs) && Date.now() >= expiresMs;
}

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

function isClinicLoginSession(value: unknown): value is ClinicLoginSession {
  return (
    isRecord(value) &&
    typeof value.clinicSlug === "string" &&
    typeof value.accessToken === "string" &&
    typeof value.appUrl === "string" &&
    (value.expiresAt === undefined || typeof value.expiresAt === "string") &&
    (value.bootstrapUrl === undefined || typeof value.bootstrapUrl === "string") &&
    (value.emrLaunchUrl === undefined || typeof value.emrLaunchUrl === "string")
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

export function readClinicLoginPrefillFromSignup(): ClinicLoginPrefill | null {
  // Email is not stored in the signup result (it is the clinic contact email).
  // Credentials are sent to the admin by email after provisioning completes.
  // No automatic prefill is possible for the new 2-step login flow.
  return null;
}

export function storeClinicLoginSession(session: ClinicLoginSession) {
  writePersistentValue(CLINIC_LOGIN_SESSION_KEY, {
    ...session,
    expiresAt: session.expiresAt ?? decodeJwtExpiryIso(session.accessToken) ?? undefined,
  });
}

export function readClinicLoginSession() {
  const raw = readPersistentValue(CLINIC_LOGIN_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isClinicLoginSession(parsed)) {
      return null;
    }

    if (isExpired(parsed.expiresAt)) {
      clearClinicLoginSession();
      return null;
    }

    if (!parsed.expiresAt) {
      const hydrated = {
        ...parsed,
        expiresAt: decodeJwtExpiryIso(parsed.accessToken) ?? undefined,
      };
      writePersistentValue(CLINIC_LOGIN_SESSION_KEY, hydrated);
      return hydrated;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearClinicLoginSession() {
  removePersistentValue(CLINIC_LOGIN_SESSION_KEY);
}

export function getClinicSessionRemainingMs(session: ClinicLoginSession | null): number | null {
  if (!session?.expiresAt) return null;
  const expiresMs = Date.parse(session.expiresAt);
  if (!Number.isFinite(expiresMs)) return null;
  return expiresMs - Date.now();
}

export function clearClinicSessionState() {
  removeSessionValue(CLINIC_ONBOARDING_STATE_KEY);
  removeSessionValue(CLINIC_SELECTED_PLAN_KEY);
  removeSessionValue(CLINIC_SIGNUP_RESULT_KEY);
  removePersistentValue(CLINIC_LOGIN_SESSION_KEY);
}
