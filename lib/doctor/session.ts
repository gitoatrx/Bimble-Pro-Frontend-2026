import type { DoctorLoginSession } from "@/lib/doctor/types";

export const DOCTOR_LOGIN_SESSION_KEY = "bimble:doctor:login-session";
const DOCTOR_SETUP_COMPLETE_KEY_PREFIX = "bimble:doctor:setup-complete:";
const DOCTOR_ONBOARDING_STAGE_KEY_PREFIX = "bimble:doctor:onboarding-stage:";
/** When UI preview is on, user can opt out for this tab until reload (set on Sign out). */
export const DOCTOR_UI_PREVIEW_OFF_KEY = "bimble:doctor:ui-preview-off";
// Short-lived OTP token kept in sessionStorage (cleared on tab close)
const DOCTOR_OTP_TOKEN_KEY = "bimble:doctor:otp-token";
// Short-lived clinic-selection token
const DOCTOR_SELECTION_TOKEN_KEY = "bimble:doctor:selection-token";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isDoctorLoginSession(value: unknown): value is DoctorLoginSession {
  return (
    isRecord(value) &&
    typeof value.doctorId === "number" &&
    typeof value.clinicSlug === "string" &&
    typeof value.clinicName === "string" &&
    typeof value.accessToken === "string" &&
    (typeof value.appUrl === "string" ||
      typeof value.bootstrapUrl === "string" ||
      typeof value.emrLaunchUrl === "string") &&
    (value.oscarAppUrl === undefined || typeof value.oscarAppUrl === "string") &&
    (value.bootstrapUrl === undefined || typeof value.bootstrapUrl === "string") &&
    (value.emrLaunchUrl === undefined || typeof value.emrLaunchUrl === "string") &&
    (value.expiresAt === undefined || typeof value.expiresAt === "string")
  );
}

// ── Persistent login session (localStorage) ────────────────────────

export function storeDoctorLoginSession(session: DoctorLoginSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    DOCTOR_LOGIN_SESSION_KEY,
    JSON.stringify({
      ...session,
      expiresAt: session.expiresAt ?? decodeJwtExpiryIso(session.accessToken) ?? undefined,
    }),
  );
}

export function readDoctorLoginSession(): DoctorLoginSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DOCTOR_LOGIN_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDoctorLoginSession(parsed)) return null;
    if (!parsed.appUrl) {
      return {
        ...parsed,
        appUrl: parsed.bootstrapUrl || parsed.emrLaunchUrl || "/",
      };
    }
    if (!parsed.expiresAt) {
      const hydrated = {
        ...parsed,
        expiresAt: decodeJwtExpiryIso(parsed.accessToken) ?? undefined,
      };
      localStorage.setItem(DOCTOR_LOGIN_SESSION_KEY, JSON.stringify(hydrated));
      return hydrated;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDoctorLoginSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DOCTOR_LOGIN_SESSION_KEY);
  sessionStorage.removeItem(DOCTOR_OTP_TOKEN_KEY);
  sessionStorage.removeItem(DOCTOR_SELECTION_TOKEN_KEY);
}

// ── Optional UI preview (browse doctor shell without real login) ───

const MOCK_DOCTOR_UI_SESSION: DoctorLoginSession = {
  doctorId: 0,
  clinicSlug: "demo-clinic",
  clinicName: "Demo Clinic",
  accessToken: "",
  appUrl: "/",
};

function onboardingCompleteStorageKey(doctorId: number) {
  return `${DOCTOR_SETUP_COMPLETE_KEY_PREFIX}${doctorId}`;
}

function onboardingStageStorageKey(doctorId: number) {
  return `${DOCTOR_ONBOARDING_STAGE_KEY_PREFIX}${doctorId}`;
}

export function isDoctorOnboardingComplete(doctorId?: number | null) {
  if (!doctorId || typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(onboardingCompleteStorageKey(doctorId)) === "1";
}

export function markDoctorOnboardingComplete(doctorId: number) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(onboardingCompleteStorageKey(doctorId), "1");
}

export function clearDoctorOnboardingComplete(doctorId?: number | null) {
  if (typeof window === "undefined" || !doctorId) return;
  localStorage.removeItem(onboardingCompleteStorageKey(doctorId));
}

export type DoctorOnboardingStage = "hlth_2870" | "hlth_2950" | "hlth_2832" | "hlth_2991" | "hlth_2820";

export function readDoctorOnboardingStage(doctorId?: number | null): DoctorOnboardingStage | null {
  if (typeof window === "undefined" || !doctorId) return null;
  const value = localStorage.getItem(onboardingStageStorageKey(doctorId));
  if (
    value === "hlth_2870" ||
    value === "hlth_2950" ||
    value === "hlth_2832" ||
    value === "hlth_2991" ||
    value === "hlth_2820"
  ) {
    return value === "hlth_2991" ? "hlth_2820" : value;
  }

  return null;
}

export function storeDoctorOnboardingStage(doctorId: number, stage: DoctorOnboardingStage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(onboardingStageStorageKey(doctorId), stage);
}

export function clearDoctorOnboardingStage(doctorId?: number | null) {
  if (typeof window === "undefined" || !doctorId) return;
  localStorage.removeItem(onboardingStageStorageKey(doctorId));
}

function isDoctorUiPreviewEnabled() {
  return process.env.NEXT_PUBLIC_DOCTOR_UI_PREVIEW === "true";
}

export function suppressDoctorUiPreviewForTab() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DOCTOR_UI_PREVIEW_OFF_KEY, "1");
}

function isDoctorUiPreviewSuppressedForTab() {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DOCTOR_UI_PREVIEW_OFF_KEY) === "1";
}

/** Mock session when preview env is on and user has not signed out of preview this tab. */
export function getDoctorUiPreviewSession(): DoctorLoginSession | null {
  if (typeof window === "undefined") return null;
  if (!isDoctorUiPreviewEnabled()) return null;
  if (isDoctorUiPreviewSuppressedForTab()) return null;
  return MOCK_DOCTOR_UI_SESSION;
}

export function getDoctorUiPreviewSessionRaw(): string | null {
  const session = getDoctorUiPreviewSession();
  return session ? JSON.stringify(session) : null;
}

/** Real login session, or preview mock if enabled — use in doctor layout only. */
export function resolveDoctorLayoutSession(): DoctorLoginSession | null {
  if (typeof window !== "undefined") {
    const real = readDoctorLoginSession();
    if (real) return real;
    return getDoctorUiPreviewSession();
  }
  // SSR: show doctor shell when preview env is on (avoids blank HTML before hydrate)
  if (process.env.NEXT_PUBLIC_DOCTOR_UI_PREVIEW === "true") {
    return MOCK_DOCTOR_UI_SESSION;
  }
  return null;
}

// ── Short-lived OTP token (sessionStorage) ─────────────────────────

export function storeDoctorOtpToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DOCTOR_OTP_TOKEN_KEY, token);
}

export function readDoctorOtpToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(DOCTOR_OTP_TOKEN_KEY);
}

export function clearDoctorOtpToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DOCTOR_OTP_TOKEN_KEY);
}

// ── Short-lived clinic-selection token (sessionStorage) ────────────

export function storeDoctorSelectionToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DOCTOR_SELECTION_TOKEN_KEY, token);
}

export function readDoctorSelectionToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(DOCTOR_SELECTION_TOKEN_KEY);
}

export function clearDoctorSelectionToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DOCTOR_SELECTION_TOKEN_KEY);
}

export function getDoctorSessionRemainingMs(session: DoctorLoginSession | null): number | null {
  if (!session?.expiresAt) return null;
  const expiresMs = Date.parse(session.expiresAt);
  if (!Number.isFinite(expiresMs)) return null;
  return expiresMs - Date.now();
}
