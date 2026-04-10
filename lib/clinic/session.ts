import type {
  ClinicCredentials,
  ClinicOnboardingFormData,
  OnboardingStepKey,
} from "@/lib/clinic/types";

const CLINIC_ONBOARDING_STATE_KEY = "bimble:clinic:onboarding-state";
const CLINIC_CREDENTIALS_KEY = "bimble:clinic:credentials";

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

function isClinicCredentials(value: unknown): value is ClinicCredentials {
  return (
    isRecord(value) &&
    typeof value.clinicName === "string" &&
    typeof value.username === "string" &&
    typeof value.password === "string" &&
    typeof value.pin === "string" &&
    (value.internalClinicCode === undefined ||
      typeof value.internalClinicCode === "string")
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

export function storeClinicOnboardingState(
  state: StoredClinicOnboardingState,
) {
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

export function storeClinicCredentials(credentials: ClinicCredentials) {
  writeSessionValue(CLINIC_CREDENTIALS_KEY, credentials);
}

export function readStoredClinicCredentials() {
  const rawCredentials = readSessionValue(CLINIC_CREDENTIALS_KEY);

  if (!rawCredentials) {
    return null;
  }

  try {
    const parsedCredentials: unknown = JSON.parse(rawCredentials);
    return isClinicCredentials(parsedCredentials) ? parsedCredentials : null;
  } catch {
    return null;
  }
}

export function clearClinicSessionState() {
  removeSessionValue(CLINIC_ONBOARDING_STATE_KEY);
  removeSessionValue(CLINIC_CREDENTIALS_KEY);
}
