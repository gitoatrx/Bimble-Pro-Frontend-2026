"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartPulse,
  MapPin,
  Package,
  Pill,
  Sparkles,
  Truck,
  Video,
} from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClinicOtpCard } from "@/components/clinic-access/clinic-otp-card";
import {
  completePatientIntake,
  fetchPatientIntakeSlots,
  savePatientIntakeHealth,
  savePatientIntakeProfile,
  savePatientIntakeVisit,
  startPatientIntakePhone,
  verifyPatientIntakePhone,
} from "@/lib/api/patient-intake";
import type {
  PatientIntakeCompletion,
  PatientFulfillment,
  PatientOnboardingDraft,
  PatientOnboardingStep,
  PatientVisitType,
} from "@/lib/patient/types";
import {
  clearDemoPatientOtp,
  clearPatientIntakeAccessToken,
  clearPatientIntakeCompletion,
  clearPatientIntakeSessionId,
  clearPatientPreviewCode,
  clearPatientOnboardingSession,
  readPatientIntakeAccessToken,
  readPatientIntakeCompletion,
  readPatientIntakeSessionId,
  readPatientPreviewCode,
  readPatientOnboardingDraft,
  readPatientOnboardingStep,
  storePatientIntakeAccessToken,
  storePatientIntakeCompletion,
  storePatientIntakeSessionId,
  storePatientPreviewCode,
  writePatientOnboardingDraft,
  writePatientOnboardingStep,
} from "@/lib/patient/onboarding-session";
import { cn } from "@/lib/utils";

const PROVINCES = ["BC", "AB", "SK", "MB", "ON", "QC", "NB", "NS", "PE", "NL", "YT", "NT", "NU"];
const GENDERS = ["Female", "Male", "Non-binary", "Prefer not to say", "Other"];

function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length < 4) return "***";
  return `***-***-${d.slice(-4)}`;
}

function formatPhoneInput(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function nextDates(count: number): string[] {
  const out: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(d.toISOString().split("T")[0]!);
  }
  return out;
}

const TIME_SLOTS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
];

function stepLabel(step: PatientOnboardingStep): string {
  const map: Record<PatientOnboardingStep, string> = {
    phone: "Phone",
    otp: "Verify",
    health: "Health ID",
    demographics: "About you",
    visit_type: "Visit type",
    slot: "Schedule",
    fulfillment: "Pickup / delivery",
    pharmacy: "Pharmacy",
    complete: "Done",
  };
  return map[step];
}

export function PatientOnboardingWizard() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [step, setStep] = useState<PatientOnboardingStep>(() => readPatientOnboardingStep());
  const [draft, setDraft] = useState<PatientOnboardingDraft>(() => {
    const baseDraft = readPatientOnboardingDraft();
    if (typeof window === "undefined") return baseDraft;

    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason")?.trim() ?? "";
    const location = params.get("location")?.trim() ?? "";
    const serviceIdRaw = params.get("serviceId");
    const serviceId = serviceIdRaw ? Number(serviceIdRaw) : null;
    return {
      ...baseDraft,
      serviceId: baseDraft.serviceId ?? (Number.isFinite(serviceId) ? serviceId : null),
      careReason: reason || baseDraft.careReason,
      careLocation: location || baseDraft.careLocation,
    };
  });
  const [otpCode, setOtpCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableTimes, setAvailableTimes] = useState<string[]>(TIME_SLOTS);
  const [completion, setCompletion] = useState<PatientIntakeCompletion | null>(() => readPatientIntakeCompletion());
  const [previewCode, setPreviewCode] = useState<string | null>(() => readPatientPreviewCode());
  const [intakeToken, setIntakeToken] = useState<string | null>(() => readPatientIntakeAccessToken());
  const [intakeSessionId, setIntakeSessionId] = useState<number | null>(() => readPatientIntakeSessionId());

  const persist = useCallback((nextDraft: PatientOnboardingDraft, nextStep: PatientOnboardingStep) => {
    writePatientOnboardingDraft(nextDraft);
    writePatientOnboardingStep(nextStep);
    setDraft(nextDraft);
    setStep(nextStep);
  }, []);

  const { progressOrder, stepIndex, progressPct } = useMemo(() => {
    const f = draft.fulfillment;
    const order: PatientOnboardingStep[] = [
      "phone",
      "otp",
      "health",
      "demographics",
      "visit_type",
      "slot",
      "fulfillment",
      ...(f === "delivery" ? (["pharmacy"] as const) : []),
      "complete",
    ];
    const idx = order.indexOf(step);
    const i = idx >= 0 ? idx : 0;
    const pct = Math.min(100, ((i + 1) / order.length) * 100);
    return { progressOrder: order, stepIndex: i, progressPct: pct };
  }, [draft.fulfillment, step]);

  function setField<K extends keyof PatientOnboardingDraft>(key: K, value: PatientOnboardingDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((e) => ({ ...e, [String(key)]: "" }));
  }

  useEffect(() => {
    if (step !== "slot" || !draft.visitType) return;
    const visitType = draft.visitType;
    let cancelled = false;

    async function loadSlots() {
      try {
        const response = await fetchPatientIntakeSlots(visitType);
        if (!cancelled) {
          setAvailableDates(response.dates?.length ? response.dates : nextDates(14));
          setAvailableTimes(response.time_slots?.length ? response.time_slots : TIME_SLOTS);
        }
      } catch {
        if (!cancelled) {
          setAvailableDates(nextDates(14));
          setAvailableTimes(TIME_SLOTS);
        }
      }
    }

    void loadSlots();
    return () => {
      cancelled = true;
    };
  }, [draft.visitType, step]);

  function validatePhone(): boolean {
    const d = draft.phone.replace(/\D/g, "");
    if (d.length < 10) {
      setErrors({ phone: "Enter a valid 10-digit Canadian phone number." });
      return false;
    }
    return true;
  }

  async function handleSendOtp() {
    if (!validatePhone()) return;
    setSubmitting(true);
    try {
      const response = await startPatientIntakePhone({
        phone: draft.phone,
        careReason: draft.careReason || "General consultation",
        careLocation: draft.careLocation || undefined,
        serviceId: draft.serviceId,
      });
      storePatientIntakeSessionId(response.intake_session_id);
      setIntakeSessionId(response.intake_session_id);
      storePatientPreviewCode(response.preview_code);
      setPreviewCode(response.preview_code);
      setOtpCode("");
      setErrors({});
      persist(draft, "otp");
    } catch (error) {
      setErrors({
        phone: error instanceof Error ? error.message : "Could not start verification. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    const entered = otpCode.replace(/\D/g, "");
    if (entered.length !== 8) {
      setErrors({ otp: "Enter the full 8-digit code." });
      return;
    }
    if (!intakeSessionId) {
      setErrors({ otp: "Verification session is missing. Please restart from phone entry." });
      return;
    }
    setSubmitting(true);
    try {
      const response = await verifyPatientIntakePhone({
        intakeSessionId,
        otpCode: entered,
      });
      clearDemoPatientOtp();
      clearPatientPreviewCode();
      setPreviewCode(null);
      storePatientIntakeAccessToken(response.access_token);
      setIntakeToken(response.access_token);
      setErrors({});
      persist(draft, "health");
    } catch (error) {
      setErrors({
        otp: error instanceof Error ? error.message : "Invalid or expired code. Try again or resend.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendOtp() {
    setOtpCode("");
    await handleSendOtp();
  }

  function validateHealth(): boolean {
    const e: Record<string, string> = {};
    if (!draft.dateOfBirth) e.dateOfBirth = "Date of birth is required.";
    if (!draft.noPhn) {
      const phn = draft.phn.replace(/\D/g, "");
      if (phn.length < 10) e.phn = "Enter a valid PHN (10 digits), or check “I don’t have a PHN”.";
    } else {
      if (!draft.emailIfNoPhn.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.emailIfNoPhn)) {
        e.emailIfNoPhn = "A valid email is required when you don’t have a PHN.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateDemographics(): boolean {
    const e: Record<string, string> = {};
    if (!draft.fullName.trim()) e.fullName = "Full name is required.";
    if (!draft.addressLine.trim()) e.addressLine = "Street address is required.";
    if (!draft.city.trim()) e.city = "City is required.";
    if (!draft.province) e.province = "Province is required.";
    if (!draft.postalCode.trim()) e.postalCode = "Postal code is required.";
    if (!draft.gender) e.gender = "Please select a gender option.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function goBack() {
    const backMap: Partial<Record<PatientOnboardingStep, PatientOnboardingStep>> = {
      otp: "phone",
      health: "otp",
      demographics: "health",
      visit_type: "demographics",
      slot: "visit_type",
      fulfillment: "slot",
      pharmacy: "fulfillment",
      complete: draft.fulfillment === "delivery" ? "pharmacy" : "fulfillment",
    };
    const prev = backMap[step];
    if (prev) persist(draft, prev);
    else if (step === "phone") router.push("/");
  }

  async function finalizeBooking(fulfillment: PatientFulfillment, pharmacyChoice?: "bimble" | "preferred") {
    if (!intakeToken) {
      setErrors({ slot: "Please verify your phone and try again." });
      return;
    }

    const nextDraft: PatientOnboardingDraft = {
      ...draft,
      fulfillment,
      pharmacyChoice: fulfillment === "delivery" ? (pharmacyChoice ?? "") : "",
    };

    setSubmitting(true);
    try {
      const response = await completePatientIntake(intakeToken, {
        fulfillment,
        pharmacyChoice: fulfillment === "delivery" ? pharmacyChoice ?? null : null,
      });
      const completionData: PatientIntakeCompletion = {
        appointmentId: response.appointment_id,
        status: response.status,
        patientId: response.patient_id,
        serviceName: response.service_name,
        summary: response.summary,
      };
      storePatientIntakeCompletion(completionData);
      setCompletion(completionData);
      persist(nextDraft, "complete");
    } catch (error) {
      setErrors({
        slot: error instanceof Error ? error.message : "Could not complete booking.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <ClinicFlowShell
      backHref="/"
      backLabel="Back to home"
      workspaceLabel="Find care"
      contentClassName="max-w-2xl"
    >
      {(draft.careReason || draft.careLocation) && step !== "complete" ? (
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-xs text-foreground">
          {draft.careReason ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 font-medium shadow-sm">
              <HeartPulse className="h-3.5 w-3.5 text-primary" />
              {draft.careReason}
            </span>
          ) : null}
          {draft.careLocation ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 font-medium shadow-sm">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {draft.careLocation}
            </span>
          ) : null}
        </div>
      ) : null}

      {step !== "complete" ? (
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>
              Step {Math.max(1, stepIndex + 1)} of {progressOrder.length}
            </span>
            <span>{stepLabel(step)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* ── Phone ───────────────────────────────────────────── */}
      {step === "phone" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="pt-phone" className="text-sm font-medium text-foreground">
              Phone number
            </label>
            <Input
              id="pt-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="(604) 555-0123"
              value={draft.phone}
              onChange={(e) => setField("phone", formatPhoneInput(e.target.value))}
              className="h-12 rounded-xl border-border"
            />
            <FieldError message={errors.phone} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/")}>
              <ChevronLeft className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="button" className="rounded-xl" onClick={() => void handleSendOtp()} disabled={submitting}>
              Send verification code
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── OTP ─────────────────────────────────────────────── */}
      {step === "otp" && (
        <div className="space-y-4">
          <ClinicOtpCard
            maskedEmail={maskPhone(draft.phone)}
            otpCode={otpCode}
            isVerifying={submitting}
            isResending={submitting}
            verifyError={errors.otp}
            onOtpChange={setOtpCode}
            onVerify={() => {
              void handleVerifyOtp();
            }}
            onResend={() => {
              void handleResendOtp();
            }}
            onBack={() => persist(draft, "phone")}
          />
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-foreground">
            Preview code:{" "}
            <span className="font-mono text-base font-bold tracking-widest">{previewCode ?? "12345678"}</span>
          </p>
        </div>
      )}

      {/* ── Health IDs ─────────────────────────────────────── */}
      {step === "health" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Health card details
            </h1>
            <p className="text-sm text-muted-foreground">
              Your date of birth and PHN help us match you to provincial records. If you don&apos;t have a PHN, use email instead.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Date of birth</label>
            <Input
              type="date"
              value={draft.dateOfBirth}
              onChange={(e) => setField("dateOfBirth", e.target.value)}
              className="h-12 rounded-xl border-border"
            />
            <FieldError message={errors.dateOfBirth} />
          </div>
          {!draft.noPhn ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Personal Health Number (PHN)</label>
              <Input
                inputMode="numeric"
                placeholder="1234 567 890"
                value={draft.phn}
                onChange={(e) => setField("phn", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="h-12 rounded-xl border-border"
              />
              <FieldError message={errors.phn} />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={draft.emailIfNoPhn}
                onChange={(e) => setField("emailIfNoPhn", e.target.value)}
                className="h-12 rounded-xl border-border"
              />
              <FieldError message={errors.emailIfNoPhn} />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <input
              type="checkbox"
              checked={draft.noPhn}
              onChange={(e) => {
                setField("noPhn", e.target.checked);
                setErrors({});
              }}
              className="size-4 rounded border-border"
            />
            <span className="text-sm text-foreground">I don&apos;t have a PHN — use my email instead</span>
          </label>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl"
              disabled={submitting}
              onClick={async () => {
                if (!validateHealth()) return;
                if (!intakeToken) {
                  setErrors({ phn: "Please verify your phone first." });
                  return;
                }
                setSubmitting(true);
                try {
                  await savePatientIntakeHealth(intakeToken, {
                    dateOfBirth: draft.dateOfBirth,
                    phn: draft.noPhn ? null : draft.phn,
                    noPhn: draft.noPhn,
                    emailIfNoPhn: draft.noPhn ? draft.emailIfNoPhn : null,
                  });
                  persist(draft, "demographics");
                } catch (error) {
                  setErrors({
                    phn: error instanceof Error ? error.message : "Could not save health details.",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Demographics ───────────────────────────────────── */}
      {step === "demographics" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              About you
            </h1>
            <p className="text-sm text-muted-foreground">We use this to personalize your visit and prescriptions.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full legal name</label>
            <Input
              value={draft.fullName}
              onChange={(e) => setField("fullName", e.target.value)}
              className="h-12 rounded-xl border-border"
              placeholder="Jordan Lee"
            />
            <FieldError message={errors.fullName} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Street address</label>
            <Input
              value={draft.addressLine}
              onChange={(e) => setField("addressLine", e.target.value)}
              className="h-12 rounded-xl border-border"
              placeholder="123 Main St"
            />
            <FieldError message={errors.addressLine} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                value={draft.city}
                onChange={(e) => setField("city", e.target.value)}
                className="h-12 rounded-xl border-border"
              />
              <FieldError message={errors.city} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Province</label>
              <select
                value={draft.province}
                onChange={(e) => setField("province", e.target.value)}
                className="flex h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
              >
                <option value="">Select</option>
                {PROVINCES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <FieldError message={errors.province} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Postal code</label>
            <Input
              value={draft.postalCode}
              onChange={(e) => setField("postalCode", e.target.value.toUpperCase().slice(0, 7))}
              className="h-12 rounded-xl border-border"
              placeholder="V6B 1A1"
            />
            <FieldError message={errors.postalCode} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gender</label>
            <select
              value={draft.gender}
              onChange={(e) => setField("gender", e.target.value)}
              className="flex h-12 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="">Select</option>
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <FieldError message={errors.gender} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl"
              disabled={submitting}
              onClick={async () => {
                if (!validateDemographics()) return;
                if (!intakeToken) {
                  setErrors({ fullName: "Please verify your phone first." });
                  return;
                }
                setSubmitting(true);
                try {
                  await savePatientIntakeProfile(intakeToken, {
                    fullName: draft.fullName,
                    addressLine: draft.addressLine,
                    city: draft.city,
                    province: draft.province,
                    postalCode: draft.postalCode,
                    gender: draft.gender,
                  });
                  persist(draft, "visit_type");
                } catch (error) {
                  setErrors({
                    fullName: error instanceof Error ? error.message : "Could not save profile.",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Visit type ─────────────────────────────────────── */}
      {step === "visit_type" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              How would you like to be seen?
            </h1>
            <p className="text-sm text-muted-foreground">Virtual visits use secure video. Walk-in is at the clinic.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                { id: "virtual" as const, title: "Virtual", desc: "Video visit from home", Icon: Video },
                { id: "walk_in" as const, title: "Walk-in", desc: "In person at the clinic", Icon: Building2 },
              ] as const
            ).map(({ id, title, desc, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  const next = {
                    ...draft,
                    visitType: id as PatientVisitType,
                    appointmentDate: "",
                    appointmentTime: "",
                  };
                  persist(next, "slot");
                }}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-[1.5rem] border p-6 text-left shadow-sm transition-all",
                  draft.visitType === id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={goBack}>
            Back
          </Button>
        </div>
      )}

      {/* ── Slot ───────────────────────────────────────────── */}
      {step === "slot" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Choose a time
            </h1>
            <p className="text-sm text-muted-foreground">
              {draft.visitType === "virtual"
                ? "Pick a slot for your virtual visit."
                : "Pick a slot for your walk-in visit."}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {(availableDates.length ? availableDates : nextDates(14)).map((key) => {
                const d = new Date(key + "T12:00:00");
                const label = d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
                const sel = draft.appointmentDate === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setField("appointmentDate", key)}
                    className={cn(
                      "min-w-[5.5rem] shrink-0 rounded-xl border px-3 py-2 text-center text-xs font-semibold transition-all",
                      sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableTimes.map((t) => {
                const sel = draft.appointmentTime === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setField("appointmentTime", t)}
                    className={cn(
                      "rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                      sel ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/30",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.slot} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl"
              disabled={submitting}
              onClick={async () => {
                if (!draft.appointmentDate || !draft.appointmentTime) {
                  setErrors({ slot: "Please select a date and time." });
                  return;
                }
                if (!intakeToken || !draft.visitType) {
                  setErrors({ slot: "Please start again from the previous step." });
                  return;
                }
                setSubmitting(true);
                try {
                  await savePatientIntakeVisit(intakeToken, {
                    visitType: draft.visitType,
                    appointmentDate: draft.appointmentDate,
                    appointmentTime: draft.appointmentTime,
                  });
                  setErrors({});
                  persist(draft, "fulfillment");
                } catch (error) {
                  setErrors({
                    slot: error instanceof Error ? error.message : "Could not save appointment slot.",
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Fulfillment ───────────────────────────────────── */}
      {step === "fulfillment" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Prescription fulfillment
            </h1>
            <p className="text-sm text-muted-foreground">Pick up at the clinic or have medication delivered.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void finalizeBooking("pickup")}
              className="flex flex-col items-start gap-3 rounded-[1.5rem] border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/40"
            >
              <Package className="h-8 w-8 text-primary" />
              <p className="font-semibold text-foreground">Pickup</p>
              <p className="text-sm text-muted-foreground">Collect at the clinic after your visit.</p>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                const next = { ...draft, fulfillment: "delivery" as PatientFulfillment };
                persist(next, "pharmacy");
              }}
              className="flex flex-col items-start gap-3 rounded-[1.5rem] border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/40"
            >
              <Truck className="h-8 w-8 text-primary" />
              <p className="font-semibold text-foreground">Delivery</p>
              <p className="text-sm text-muted-foreground">We&apos;ll route your Rx to a pharmacy.</p>
            </button>
          </div>
          <Button type="button" variant="outline" onClick={goBack}>
            Back
          </Button>
        </div>
      )}

      {/* ── Pharmacy (delivery only) ───────────────────────── */}
      {step === "pharmacy" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Choose a pharmacy
            </h1>
            <p className="text-sm text-muted-foreground">Delivery timing depends on which pharmacy you select.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setField("pharmacyChoice", "bimble")}
              className={cn(
                "flex flex-col items-start gap-3 rounded-[1.5rem] border p-6 text-left shadow-sm transition-all",
                draft.pharmacyChoice === "bimble"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <Pill className="h-8 w-8 text-primary" />
              <p className="font-semibold text-foreground">Bimble pharmacy</p>
              <p className="text-sm text-muted-foreground">Our integrated network — fastest delivery.</p>
            </button>
            <button
              type="button"
              onClick={() => setField("pharmacyChoice", "preferred")}
              className={cn(
                "flex flex-col items-start gap-3 rounded-[1.5rem] border p-6 text-left shadow-sm transition-all",
                draft.pharmacyChoice === "preferred"
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <MapPin className="h-8 w-8 text-primary" />
              <p className="font-semibold text-foreground">My preferred pharmacy</p>
              <p className="text-sm text-muted-foreground">A partner location you already use.</p>
            </button>
          </div>
          {draft.pharmacyChoice === "bimble" ? (
            <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground">
              <Sparkles className="mb-1 inline h-4 w-4 text-primary" />{" "}
              <strong>Our pharmacist will deliver in about 1 hour</strong> after your prescription is ready.
            </div>
          ) : null}
          {draft.pharmacyChoice === "preferred" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
              <Clock className="mb-1 inline h-4 w-4" />{" "}
              If you choose your preferred pharmacy, delivery may take <strong>up to 3–5 hours</strong>.
            </div>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={goBack}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl"
              disabled={!draft.pharmacyChoice || submitting}
              onClick={() => {
                if (!draft.pharmacyChoice) return;
                void finalizeBooking("delivery", draft.pharmacyChoice);
              }}
            >
              Confirm booking
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Complete ───────────────────────────────────────── */}
      {step === "complete" && (
        <div className="space-y-8 text-center sm:text-left">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300 sm:mx-0">
            <Check className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Booking completed</p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              You&apos;re all set
            </h1>
            <p className="text-sm text-muted-foreground">
              We saved your visit preferences. You&apos;ll receive a confirmation text shortly.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-border bg-card p-6 text-left text-sm shadow-sm">
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  <strong className="text-foreground">
                    {completion?.summary.appointment_date || draft.appointmentDate}
                  </strong>{" "}
                  at{" "}
                  <strong className="text-foreground">
                    {completion?.summary.appointment_time || draft.appointmentTime}
                  </strong>{" "}
                  ·{" "}
                  {(completion?.summary.visit_type || draft.visitType) === "virtual" ? "Virtual" : "Walk-in"}
                </span>
              </li>
              <li className="flex gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {completion?.summary.location || draft.careLocation || `${draft.city}, ${draft.province}`}
                </span>
              </li>
              <li className="flex gap-2">
                {(completion?.summary.fulfillment || draft.fulfillment) === "pickup" ? (
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                )}
                <span>
                  {(completion?.summary.fulfillment || draft.fulfillment) === "pickup"
                    ? "Pickup at clinic"
                    : (completion?.summary.pharmacy_choice || draft.pharmacyChoice) === "bimble"
                      ? "Delivery — Bimble pharmacy (~1 hour)"
                      : "Delivery — your preferred pharmacy (3–5 hours)"}
                </span>
              </li>
              {completion?.serviceName ? (
                <li className="flex gap-2">
                  <HeartPulse className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{completion.serviceName}</span>
                </li>
              ) : null}
            </ul>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                clearPatientOnboardingSession();
                setCompletion(null);
                setPreviewCode(null);
                setIntakeToken(null);
                setIntakeSessionId(null);
                router.push("/patient/onboarding");
              }}
            >
              Book another
            </Button>
            <Button
              type="button"
              className="flex-1 rounded-xl"
              onClick={() => {
                clearPatientOnboardingSession();
                setCompletion(null);
                setPreviewCode(null);
                setIntakeToken(null);
                setIntakeSessionId(null);
                router.push("/");
              }}
            >
              Back to home
            </Button>
          </div>
        </div>
      )}
    </ClinicFlowShell>
  );
}
