import type { PatientLoginSession } from "@/lib/patient/types";

export const PATIENT_LOGIN_SESSION_KEY = "bimble:patient:login-session";

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

function isPatientLoginSession(value: unknown): value is PatientLoginSession {
  return (
    isRecord(value) &&
    typeof value.patientId === "number" &&
    typeof value.accessToken === "string" &&
    (value.expiresAt === undefined || typeof value.expiresAt === "string")
  );
}

export function storePatientLoginSession(session: PatientLoginSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PATIENT_LOGIN_SESSION_KEY,
    JSON.stringify({
      ...session,
      expiresAt: session.expiresAt ?? decodeJwtExpiryIso(session.accessToken) ?? undefined,
    }),
  );
}

export function readPatientLoginSession(): PatientLoginSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PATIENT_LOGIN_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPatientLoginSession(parsed)) {
      return null;
    }

    if (!parsed.expiresAt) {
      const hydrated = {
        ...parsed,
        expiresAt: decodeJwtExpiryIso(parsed.accessToken) ?? undefined,
      };
      localStorage.setItem(PATIENT_LOGIN_SESSION_KEY, JSON.stringify(hydrated));
      return hydrated;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearPatientLoginSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PATIENT_LOGIN_SESSION_KEY);
}
