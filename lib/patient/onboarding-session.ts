import type {
  PatientIntakeCompletion,
  PatientOnboardingDraft,
  PatientOnboardingStep,
} from "@/lib/patient/types";
import { initialPatientOnboardingDraft } from "@/lib/patient/types";

const DRAFT_KEY = "bimble:patient:onboarding-draft";
const STEP_KEY = "bimble:patient:onboarding-step";
const DEMO_OTP_KEY = "bimble:patient:demo-otp";
const INTAKE_ACCESS_TOKEN_KEY = "bimble:patient:intake-access-token";
const INTAKE_SESSION_ID_KEY = "bimble:patient:intake-session-id";
const INTAKE_PREVIEW_CODE_KEY = "bimble:patient:intake-preview-code";
const INTAKE_COMPLETION_KEY = "bimble:patient:intake-completion";

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === "object" && !Array.isArray(v));
}

function isStep(v: unknown): v is PatientOnboardingStep {
  return (
    v === "phone" ||
    v === "otp" ||
    v === "health" ||
    v === "demographics" ||
    v === "visit_type" ||
    v === "slot" ||
    v === "fulfillment" ||
    v === "pharmacy" ||
    v === "complete"
  );
}

function parseDraft(raw: string | null): PatientOnboardingDraft {
  if (!raw) return { ...initialPatientOnboardingDraft };
  try {
    const p: unknown = JSON.parse(raw);
    if (!isRecord(p)) return { ...initialPatientOnboardingDraft };
    return {
      ...initialPatientOnboardingDraft,
      serviceId: typeof p.serviceId === "number" ? p.serviceId : null,
      serviceName: typeof p.serviceName === "string" ? p.serviceName : "",
      careReason: typeof p.careReason === "string" ? p.careReason : "",
      careLocation: typeof p.careLocation === "string" ? p.careLocation : "",
      phone: typeof p.phone === "string" ? p.phone : "",
      dateOfBirth: typeof p.dateOfBirth === "string" ? p.dateOfBirth : "",
      phn: typeof p.phn === "string" ? p.phn : "",
      noPhn: Boolean(p.noPhn),
      emailIfNoPhn: typeof p.emailIfNoPhn === "string" ? p.emailIfNoPhn : "",
      firstName: typeof p.firstName === "string" ? p.firstName : "",
      lastName: typeof p.lastName === "string" ? p.lastName : "",
      addressLine: typeof p.addressLine === "string" ? p.addressLine : "",
      city: typeof p.city === "string" ? p.city : "",
      province: typeof p.province === "string" ? p.province : "",
      postalCode: typeof p.postalCode === "string" ? p.postalCode : "",
      gender: typeof p.gender === "string" ? p.gender : "",
      visitType: p.visitType === "virtual" || p.visitType === "walk_in" ? p.visitType : "",
      appointmentDate: typeof p.appointmentDate === "string" ? p.appointmentDate : "",
      appointmentTime: typeof p.appointmentTime === "string" ? p.appointmentTime : "",
      fulfillment: p.fulfillment === "pickup" || p.fulfillment === "delivery" ? p.fulfillment : "",
      pharmacyChoice:
        p.pharmacyChoice === "bimble" || p.pharmacyChoice === "preferred" ? p.pharmacyChoice : "",
    };
  } catch {
    return { ...initialPatientOnboardingDraft };
  }
}

function parseCompletion(raw: string | null): PatientIntakeCompletion | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return null;
    if (
      typeof parsed.appointmentId !== "number" ||
      typeof parsed.status !== "string" ||
      typeof parsed.patientId !== "number" ||
      !isRecord(parsed.summary)
    ) {
      return null;
    }

    const summary = parsed.summary;
    const visitType = summary.visit_type;
    const fulfillment = summary.fulfillment;
    const pharmacyChoice = summary.pharmacy_choice;

    if (
      (visitType !== "virtual" && visitType !== "walk_in") ||
      (fulfillment !== "pickup" && fulfillment !== "delivery")
    ) {
      return null;
    }

    if (
      pharmacyChoice !== null &&
      pharmacyChoice !== undefined &&
      pharmacyChoice !== "bimble" &&
      pharmacyChoice !== "preferred"
    ) {
      return null;
    }

    return {
      appointmentId: parsed.appointmentId,
      status: parsed.status,
      patientId: parsed.patientId,
      serviceName: typeof parsed.serviceName === "string" ? parsed.serviceName : null,
      summary: {
        visit_type: visitType,
        appointment_date:
          typeof summary.appointment_date === "string" ? summary.appointment_date : "",
        appointment_time:
          typeof summary.appointment_time === "string" ? summary.appointment_time : "",
        fulfillment,
        pharmacy_choice: pharmacyChoice ?? null,
        location: typeof summary.location === "string" ? summary.location : null,
      },
    };
  } catch {
    return null;
  }
}

export function readPatientOnboardingDraft(): PatientOnboardingDraft {
  if (typeof window === "undefined") return { ...initialPatientOnboardingDraft };
  return parseDraft(sessionStorage.getItem(DRAFT_KEY));
}

export function writePatientOnboardingDraft(draft: PatientOnboardingDraft) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function readPatientOnboardingStep(): PatientOnboardingStep {
  if (typeof window === "undefined") return "phone";
  const raw = sessionStorage.getItem(STEP_KEY);
  return isStep(raw) ? raw : "phone";
}

export function writePatientOnboardingStep(step: PatientOnboardingStep) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STEP_KEY, step);
}

export function clearPatientOnboardingSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(STEP_KEY);
  sessionStorage.removeItem(DEMO_OTP_KEY);
  sessionStorage.removeItem(INTAKE_ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(INTAKE_SESSION_ID_KEY);
  sessionStorage.removeItem(INTAKE_PREVIEW_CODE_KEY);
  sessionStorage.removeItem(INTAKE_COMPLETION_KEY);
}

export function storeDemoPatientOtp(code: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DEMO_OTP_KEY, code);
}

export function readDemoPatientOtp(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(DEMO_OTP_KEY);
}

export function clearDemoPatientOtp() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DEMO_OTP_KEY);
}

export function storePatientIntakeAccessToken(token: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INTAKE_ACCESS_TOKEN_KEY, token);
}

export function readPatientIntakeAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(INTAKE_ACCESS_TOKEN_KEY);
}

export function clearPatientIntakeAccessToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(INTAKE_ACCESS_TOKEN_KEY);
}

export function storePatientIntakeSessionId(sessionId: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INTAKE_SESSION_ID_KEY, String(sessionId));
}

export function readPatientIntakeSessionId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(INTAKE_SESSION_ID_KEY);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function clearPatientIntakeSessionId() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(INTAKE_SESSION_ID_KEY);
}

export function storePatientPreviewCode(code: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INTAKE_PREVIEW_CODE_KEY, code);
}

export function readPatientPreviewCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(INTAKE_PREVIEW_CODE_KEY);
}

export function clearPatientPreviewCode() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(INTAKE_PREVIEW_CODE_KEY);
}

export function storePatientIntakeCompletion(completion: PatientIntakeCompletion) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INTAKE_COMPLETION_KEY, JSON.stringify(completion));
}

export function readPatientIntakeCompletion(): PatientIntakeCompletion | null {
  if (typeof window === "undefined") return null;
  return parseCompletion(sessionStorage.getItem(INTAKE_COMPLETION_KEY));
}

export function clearPatientIntakeCompletion() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(INTAKE_COMPLETION_KEY);
}
