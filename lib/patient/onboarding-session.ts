import type { PatientOnboardingDraft, PatientOnboardingStep } from "@/lib/patient/types";
import { initialPatientOnboardingDraft } from "@/lib/patient/types";

const DRAFT_KEY = "bimble:patient:onboarding-draft";
const STEP_KEY = "bimble:patient:onboarding-step";
const DEMO_OTP_KEY = "bimble:patient:demo-otp";

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
      careReason: typeof p.careReason === "string" ? p.careReason : "",
      careLocation: typeof p.careLocation === "string" ? p.careLocation : "",
      phone: typeof p.phone === "string" ? p.phone : "",
      dateOfBirth: typeof p.dateOfBirth === "string" ? p.dateOfBirth : "",
      phn: typeof p.phn === "string" ? p.phn : "",
      noPhn: Boolean(p.noPhn),
      emailIfNoPhn: typeof p.emailIfNoPhn === "string" ? p.emailIfNoPhn : "",
      fullName: typeof p.fullName === "string" ? p.fullName : "",
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
