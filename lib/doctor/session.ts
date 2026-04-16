import type { DoctorLoginSession } from "@/lib/doctor/types";

const DOCTOR_LOGIN_SESSION_KEY = "bimble:doctor:login-session";
// Short-lived OTP token kept in sessionStorage (cleared on tab close)
const DOCTOR_OTP_TOKEN_KEY = "bimble:doctor:otp-token";
// Short-lived clinic-selection token
const DOCTOR_SELECTION_TOKEN_KEY = "bimble:doctor:selection-token";

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
    typeof value.appUrl === "string"
  );
}

// ── Persistent login session (localStorage) ────────────────────────

export function storeDoctorLoginSession(session: DoctorLoginSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOCTOR_LOGIN_SESSION_KEY, JSON.stringify(session));
}

export function readDoctorLoginSession(): DoctorLoginSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(DOCTOR_LOGIN_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isDoctorLoginSession(parsed) ? parsed : null;
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
