"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchClinicFacilityForm,
  submitClinicFacilityForm,
  type ClinicFacilityFormDeclaration,
  type ClinicFacilityFormResponse,
  type ClinicFacilityFormSubmission,
  type ClinicFacilityFormUiContent,
} from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";

const FORM_CODE = "hlth-2948";
const FORM_TITLE = "Application for MSP Facility Number";

type FacilityFormState = {
  administratorLastName: string;
  administratorFirstName: string;
  mspPractitionerNumber: string;
  facilityOrPracticeName: string;
  facilityEffectiveDate: string;
  contactEmail: string;
  contactPhoneNumber: string;
  contactFaxNumber: string;
  facilityPhysicalAddress: string;
  facilityPhysicalCity: string;
  facilityPhysicalPostalCode: string;
  facilityMailingAddress: string;
  facilityMailingCity: string;
  facilityMailingPostalCode: string;
  bcpAppliedToEligibleFees: boolean;
  confirmDeclarations: boolean;
  dateSigned: string;
  signatureLabel: string;
  signatureDataUrl: string;
};

type FacilityFormAssets = {
  uiContent: ClinicFacilityFormUiContent | null;
  savedAt: string;
  missingFields: string[];
};

function localIsoDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function createEmptyState(): FacilityFormState {
  const today = localIsoDate();

  return {
    administratorLastName: "",
    administratorFirstName: "",
    mspPractitionerNumber: "",
    facilityOrPracticeName: "",
    facilityEffectiveDate: today,
    contactEmail: "",
    contactPhoneNumber: "",
    contactFaxNumber: "",
    facilityPhysicalAddress: "",
    facilityPhysicalCity: "",
    facilityPhysicalPostalCode: "",
    facilityMailingAddress: "",
    facilityMailingCity: "",
    facilityMailingPostalCode: "",
    bcpAppliedToEligibleFees: true,
    confirmDeclarations: false,
    dateSigned: today,
    signatureLabel: "",
    signatureDataUrl: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

function parseSignature(source: Record<string, unknown>) {
  const directSignature = isRecord(source.signature) ? source.signature : null;

  const signatureDataUrl =
    asString(source.signatureDataUrl) ||
    asString(source.signature_data_url) ||
    asString(directSignature?.signatureDataUrl) ||
    asString(directSignature?.signature_data_url);
  const signatureLabel =
    asString(source.signatureLabel) ||
    asString(source.signature_label) ||
    asString(directSignature?.signatureLabel) ||
    asString(directSignature?.signature_label);

  return {
    signatureDataUrl,
    signatureLabel,
  };
}

function parseFormState(response: ClinicFacilityFormResponse) {
  const saved = response.saved_values ?? {};
  const fallback = response.field_values ?? {};
  const source = isRecord(saved) && Object.keys(saved).length > 0 ? saved : fallback;
  const signature = parseSignature(source);
  const current = createEmptyState();

  const firstName = asString(source.administratorFirstName);
  const lastName = asString(source.administratorLastName);

  return {
    ...current,
    administratorLastName: lastName,
    administratorFirstName: firstName,
    mspPractitionerNumber: asString(source.mspPractitionerNumber),
    facilityOrPracticeName: asString(source.facilityOrPracticeName),
    facilityEffectiveDate: asString(source.facilityEffectiveDate) || current.facilityEffectiveDate,
    contactEmail: asString(source.contactEmail),
    contactPhoneNumber: asString(source.contactPhoneNumber),
    contactFaxNumber: asString(source.contactFaxNumber),
    facilityPhysicalAddress: asString(source.facilityPhysicalAddress),
    facilityPhysicalCity: asString(source.facilityPhysicalCity),
    facilityPhysicalPostalCode: asString(source.facilityPhysicalPostalCode),
    facilityMailingAddress: asString(source.facilityMailingAddress),
    facilityMailingCity: asString(source.facilityMailingCity),
    facilityMailingPostalCode: asString(source.facilityMailingPostalCode),
    bcpAppliedToEligibleFees:
      typeof source.bcpAppliedToEligibleFees === "boolean"
        ? source.bcpAppliedToEligibleFees
        : true,
    confirmDeclarations:
      typeof source.confirmDeclarations === "boolean"
        ? source.confirmDeclarations
        : asBoolean(response.confirm_declarations),
    dateSigned: asString(source.dateSigned) || current.dateSigned,
    signatureLabel: signature.signatureLabel || [firstName, lastName].filter(Boolean).join(" "),
    signatureDataUrl: signature.signatureDataUrl,
  };
}

function displayFieldLabel(
  key: string,
  fieldLabels?: Record<string, string>,
  fallback?: string,
) {
  return fieldLabels?.[key] ?? fallback ?? key;
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatResponseError(message: string, missingFields: string[] = []) {
  if (missingFields.length === 0) {
    return message;
  }

  return `${message} Missing: ${missingFields.join(", ")}.`;
}

function DialogField({
  label,
  required = false,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </label>
  );
}

function DeclarationList({
  declarations,
  consentLabel,
  consentChecked,
  consentError,
  onConsentChange,
}: {
  declarations: ClinicFacilityFormDeclaration[];
  consentLabel: string;
  consentChecked: boolean;
  consentError?: string;
  onConsentChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 px-4 py-4">
      <div className="space-y-3">
        {declarations.map((declaration) => (
          <div key={declaration.id} className="rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {declaration.summary_text}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {declaration.full_text}
            </p>
          </div>
        ))}
      </div>

      <label className="mt-4 flex items-start gap-3 rounded-2xl border border-border px-4 py-4">
        <input
          type="checkbox"
          checked={consentChecked}
          onChange={(event) => onConsentChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm leading-6 text-foreground">{consentLabel}</span>
      </label>
      {consentError ? <p className="mt-2 text-xs text-destructive">{consentError}</p> : null}
    </div>
  );
}

function SignatureField({
  value,
  onChange,
  onClear,
  error,
}: {
  value: FacilityFormState;
  onChange: (next: Partial<FacilityFormState>) => void;
  onClear: () => void;
  error?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const previousPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const height = 220;

    const setupCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.lineWidth = 2.5;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.strokeStyle = "#0f172a";
    };

    setupCanvas();

    const handleResize = () => setupCanvas();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function getPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function commitCanvas() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    onChange({ signatureDataUrl: canvas.toDataURL("image/png") });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);

    if (!canvas || !context || !point) {
      return;
    }

    drawingRef.current = true;
    previousPointRef.current = point;
    canvas.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const point = getPoint(event);
    const previousPoint = previousPointRef.current;

    if (!canvas || !context || !point || !previousPoint) {
      return;
    }

    context.beginPath();
    context.moveTo(previousPoint.x, previousPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    previousPointRef.current = point;
  }

  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    previousPointRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    commitCanvas();
  }

  function handlePointerLeave() {
    if (!drawingRef.current) {
      return;
    }

    drawingRef.current = false;
    previousPointRef.current = null;
    commitCanvas();
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (canvas && context) {
      const rect = canvas.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, 220);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, rect.width, 220);
    }

    onClear();
  }

  return (
    <div className="rounded-2xl border border-border/70 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Signature</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </div>

      <div className="space-y-4">
        <DialogField label="Signature label" required error={error}>
          <Input
            value={value.signatureLabel}
            placeholder="Aman Sharma"
            onChange={(event) => onChange({ signatureLabel: event.target.value })}
          />
        </DialogField>

        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">Draw signature</span>
          <div className="overflow-hidden rounded-2xl border border-border">
            <canvas
              ref={canvasRef}
              width={1200}
              height={220}
              className="h-[220px] w-full touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function RadioChoiceCard({
  label,
  summary,
  checked,
  onSelect,
}: {
  label: string;
  summary: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border px-4 py-4 text-left transition",
        checked
          ? "border-primary shadow-sm"
          : "border-border hover:border-primary/30",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border",
            checked ? "border-primary bg-primary" : "border-border",
          )}
        >
          {checked ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>
      </div>
    </button>
  );
}

function MSPApplicationDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const session = readClinicLoginSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState<FacilityFormAssets>({
    uiContent: null,
    savedAt: "",
    missingFields: [],
  });
  const [formState, setFormState] = useState<FacilityFormState>(() =>
    createEmptyState(),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof FacilityFormState, string | undefined>>
  >({});

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!session?.accessToken) {
      setError("Please sign in to apply for the MSP facility number form.");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    setFieldErrors({});

    fetchClinicFacilityForm(session.accessToken, FORM_CODE)
      .then((response) => {
        if (!active) return;

        setAssets({
          uiContent: response.ui_content,
          savedAt: response.saved_at,
          missingFields: response.missing_fields ?? [],
        });
        setFormState(parseFormState(response));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load the application form.");
        setAssets({
          uiContent: null,
          savedAt: "",
          missingFields: [],
        });
        setFormState(createEmptyState());
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [open, session?.accessToken]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function validate(current: FacilityFormState) {
    const nextErrors: Partial<Record<keyof FacilityFormState, string>> = {};

    const requiredFields: Array<keyof FacilityFormState> = [
      "administratorLastName",
      "administratorFirstName",
      "mspPractitionerNumber",
      "facilityOrPracticeName",
      "facilityEffectiveDate",
      "contactPhoneNumber",
      "facilityPhysicalAddress",
      "facilityPhysicalCity",
      "facilityPhysicalPostalCode",
      "dateSigned",
    ];

    for (const field of requiredFields) {
      const value = current[field];
      if (typeof value === "string" && !value.trim()) {
        nextErrors[field] = "This field is required.";
      }
    }

    if (!current.confirmDeclarations) {
      nextErrors.confirmDeclarations = "You must confirm the declarations to continue.";
    }

    if (!current.signatureLabel.trim()) {
      nextErrors.signatureLabel = "Signature label is required.";
    }

    if (!current.signatureDataUrl.trim()) {
      nextErrors.signatureDataUrl = "Please draw a signature.";
    } else if (
      !current.signatureDataUrl.startsWith("data:image/png;base64,") &&
      !current.signatureDataUrl.startsWith("data:image/jpeg;base64,")
    ) {
      nextErrors.signatureDataUrl = "Signature must be a valid PNG or JPEG data URL.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("Please sign in to submit the application.");
      return;
    }

    const nextErrors = validate(formState);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please complete the required fields before submitting.");
      return;
    }

    const payload: ClinicFacilityFormSubmission = {
      administratorLastName: formState.administratorLastName.trim(),
      administratorFirstName: formState.administratorFirstName.trim(),
      mspPractitionerNumber: formState.mspPractitionerNumber.trim(),
      facilityOrPracticeName: formState.facilityOrPracticeName.trim(),
      facilityEffectiveDate: formState.facilityEffectiveDate,
      contactEmail: formState.contactEmail.trim() || undefined,
      contactPhoneNumber: formState.contactPhoneNumber.trim(),
      contactFaxNumber: formState.contactFaxNumber.trim() || undefined,
      facilityPhysicalAddress: formState.facilityPhysicalAddress.trim(),
      facilityPhysicalCity: formState.facilityPhysicalCity.trim(),
      facilityPhysicalPostalCode: formState.facilityPhysicalPostalCode.trim(),
      facilityMailingAddress: formState.facilityMailingAddress.trim() || undefined,
      facilityMailingCity: formState.facilityMailingCity.trim() || undefined,
      facilityMailingPostalCode: formState.facilityMailingPostalCode.trim() || undefined,
      bcpAppliedToEligibleFees: formState.bcpAppliedToEligibleFees,
      confirmDeclarations: true,
      dateSigned: formState.dateSigned,
      signature: {
        signatureDataUrl: formState.signatureDataUrl.trim(),
        signatureLabel: formState.signatureLabel.trim(),
      },
    };

    setSaving(true);
    setError("");

    try {
      const response = await submitClinicFacilityForm(session.accessToken, FORM_CODE, payload);
      const missingFields = response.missing_fields ?? [];

      if (missingFields.length > 0) {
        setAssets({
          uiContent: response.ui_content,
          savedAt: response.saved_at,
          missingFields,
        });
        setError(
          formatResponseError(
            "The backend returned the application with missing fields.",
            missingFields.map((field) => displayFieldLabel(field, response.ui_content.field_labels, humanizeKey(field))),
          ),
        );
        return;
      }

      setAssets({
        uiContent: response.ui_content,
        savedAt: response.saved_at,
        missingFields: [],
      });
      setFormState(parseFormState(response));
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the application.",
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldLabels = assets.uiContent?.field_labels ?? {};
  const declarations = assets.uiContent?.part_c?.declarations ?? [];
  const partBOptions = assets.uiContent?.part_b?.options ?? [
    {
      value: "APPLY",
      label: "Apply Business Cost Premium to this facility",
      full_text:
        "The applicant requests that the Business Cost Premium be applied to Eligible Fees paid to Eligible Physicians attached to this facility.",
      summary_text:
        "Select this when the clinic wants Business Cost Premium applied for eligible physicians attached to this facility.",
    },
    {
      value: "DO_NOT_APPLY",
      label: "Do not apply Business Cost Premium to this facility",
      full_text:
        "The applicant requests that the Business Cost Premium not be applied to the facility referenced in this form.",
      summary_text:
        "Select this when the clinic does not want Business Cost Premium applied to this facility.",
    },
  ];

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-border bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 py-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              {FORM_TITLE}
            </h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-dashed border-border">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Loading application details...
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <section className="rounded-3xl border border-border px-5 pb-5 pt-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField
                    label={displayFieldLabel(
                      "administratorFirstName",
                      fieldLabels,
                      "Administrator first name",
                    )}
                    required
                    error={fieldErrors.administratorFirstName}
                  >
                    <Input
                      value={formState.administratorFirstName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          administratorFirstName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "administratorLastName",
                      fieldLabels,
                      "Administrator last name",
                    )}
                    required
                    error={fieldErrors.administratorLastName}
                  >
                    <Input
                      value={formState.administratorLastName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          administratorLastName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel(
                      "mspPractitionerNumber",
                      fieldLabels,
                      "MSP practitioner number",
                    )}
                    required
                    error={fieldErrors.mspPractitionerNumber}
                  >
                    <Input
                      value={formState.mspPractitionerNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          mspPractitionerNumber: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "facilityOrPracticeName",
                      fieldLabels,
                      "Facility or practice name",
                    )}
                    required
                    error={fieldErrors.facilityOrPracticeName}
                  >
                    <Input
                      value={formState.facilityOrPracticeName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityOrPracticeName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel(
                      "facilityEffectiveDate",
                      fieldLabels,
                      "Facility effective date",
                    )}
                    required
                    error={fieldErrors.facilityEffectiveDate}
                  >
                    <Input
                      type="date"
                      value={formState.facilityEffectiveDate}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityEffectiveDate: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("dateSigned", fieldLabels, "Date signed")}
                    required
                    error={fieldErrors.dateSigned}
                  >
                    <Input
                      type="date"
                      value={formState.dateSigned}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          dateSigned: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel("contactEmail", fieldLabels, "Contact email")}
                    error={fieldErrors.contactEmail}
                  >
                    <Input
                      type="email"
                      placeholder="Optional"
                      value={formState.contactEmail}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          contactEmail: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "contactPhoneNumber",
                      fieldLabels,
                      "Contact phone number",
                    )}
                    required
                    error={fieldErrors.contactPhoneNumber}
                  >
                    <Input
                      type="tel"
                      value={formState.contactPhoneNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          contactPhoneNumber: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel("contactFaxNumber", fieldLabels, "Contact fax number")}
                    error={fieldErrors.contactFaxNumber}
                  >
                    <Input
                      type="tel"
                      placeholder="Optional"
                      value={formState.contactFaxNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          contactFaxNumber: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "facilityPhysicalAddress",
                      fieldLabels,
                      "Facility physical address",
                    )}
                    required
                    error={fieldErrors.facilityPhysicalAddress}
                  >
                    <Input
                      value={formState.facilityPhysicalAddress}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityPhysicalAddress: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel(
                      "facilityPhysicalCity",
                      fieldLabels,
                      "Facility physical city",
                    )}
                    required
                    error={fieldErrors.facilityPhysicalCity}
                  >
                    <Input
                      value={formState.facilityPhysicalCity}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityPhysicalCity: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "facilityPhysicalPostalCode",
                      fieldLabels,
                      "Facility physical postal code",
                    )}
                    required
                    error={fieldErrors.facilityPhysicalPostalCode}
                  >
                    <Input
                      value={formState.facilityPhysicalPostalCode}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityPhysicalPostalCode: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    className="md:col-span-2"
                    label={displayFieldLabel(
                      "facilityMailingAddress",
                      fieldLabels,
                      "Mailing address if different",
                    )}
                    error={fieldErrors.facilityMailingAddress}
                  >
                    <Input
                      placeholder="Optional"
                      value={formState.facilityMailingAddress}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityMailingAddress: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel("facilityMailingCity", fieldLabels, "Mailing city")}
                    error={fieldErrors.facilityMailingCity}
                  >
                    <Input
                      placeholder="Optional"
                      value={formState.facilityMailingCity}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityMailingCity: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "facilityMailingPostalCode",
                      fieldLabels,
                      "Mailing postal code",
                    )}
                    error={fieldErrors.facilityMailingPostalCode}
                  >
                    <Input
                      placeholder="Optional"
                      value={formState.facilityMailingPostalCode}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityMailingPostalCode: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                </div>
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-white">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {assets.uiContent?.part_b?.title ?? "Business Cost Premium"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assets.uiContent?.part_b?.summary ??
                        "Choose whether the clinic is requesting Business Cost Premium for eligible attached physicians at this facility."}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <RadioChoiceCard
                    label={partBOptions[0]?.label ?? "Apply Business Cost Premium to this facility"}
                    summary={partBOptions[0]?.summary_text ?? ""}
                    checked={formState.bcpAppliedToEligibleFees}
                    onSelect={() =>
                      setFormState((current) => ({
                        ...current,
                        bcpAppliedToEligibleFees: true,
                      }))
                    }
                  />
                  <RadioChoiceCard
                    label={
                      partBOptions[1]?.label ??
                      "Do not apply Business Cost Premium to this facility"
                    }
                    summary={partBOptions[1]?.summary_text ?? ""}
                    checked={!formState.bcpAppliedToEligibleFees}
                    onSelect={() =>
                      setFormState((current) => ({
                        ...current,
                        bcpAppliedToEligibleFees: false,
                      }))
                    }
                  />
                </div>
                {fieldErrors.bcpAppliedToEligibleFees ? (
                  <p className="mt-3 text-xs text-destructive">
                    {fieldErrors.bcpAppliedToEligibleFees}
                  </p>
                ) : null}
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-white">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {assets.uiContent?.part_c?.title ?? "Declaration"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assets.uiContent?.part_c?.summary ??
                        "Read the declarations below, confirm agreement, and then sign as the clinic administrator."}
                    </p>
                  </div>
                </div>

                <DeclarationList
                  declarations={declarations}
                  consentLabel={
                    assets.uiContent?.part_c?.consent_label ??
                    "I have read and agree to the declarations above."
                  }
                  consentChecked={formState.confirmDeclarations}
                  consentError={fieldErrors.confirmDeclarations}
                  onConsentChange={(checked) =>
                    setFormState((current) => ({
                      ...current,
                      confirmDeclarations: checked,
                    }))
                  }
                />
              </section>

              <section>
                <div className="mt-2">
                  <SignatureField
                    value={formState}
                    error={fieldErrors.signatureDataUrl || fieldErrors.signatureLabel}
                    onChange={(next) => setFormState((current) => ({ ...current, ...next }))}
                    onClear={() =>
                      setFormState((current) => ({
                        ...current,
                        signatureDataUrl: "",
                      }))
                    }
                  />
                </div>
              </section>

              {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
                  <p>{error}</p>
                </div>
              ) : null}
              {assets.missingFields.length > 0 ? (
                <div className="rounded-2xl border border-amber-200 px-4 py-3 text-sm text-amber-950">
                  <p className="font-semibold">Missing fields reported by backend</p>
                  <p className="mt-1 text-xs text-amber-900/80">
                    {assets.missingFields.join(", ")}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit application"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function MspFacilityNumberApplicationSection() {
  const session = readClinicLoginSession();
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-border bg-white">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {FORM_TITLE}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setOpen(true)}
              disabled={!session?.accessToken}
              size="sm"
              className="gap-2 px-4"
            >
              Apply
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <MSPApplicationDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
