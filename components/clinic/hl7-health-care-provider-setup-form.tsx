"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchClinicHl7HealthCareProviderSetupForm,
  submitClinicHl7HealthCareProviderSetupForm,
  type ClinicHl7HealthCareProviderSetupRequest,
  type ClinicHl7HealthCareProviderSetupResponse,
  type ClinicHl7HealthCareProviderSetupUiContent,
  type ClinicHl7SetupInstruction,
  type ClinicHl7SupportedContentType,
} from "@/lib/api/clinic-dashboard";
import {
  capitalizeLeadingLetter,
  hasExactDigits,
  updateLiveFutureDateField,
  updateLiveTenDigitField,
  validateEmail,
} from "@/lib/form-validation";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { digitsOnly } from "@/components/doctor/doctor-form-shared";

const FORM_TITLE = "HL7 Health Care Provider Setup Form";

type Hl7SetupFormState = {
  clinicName: string;
  primaryContact: string;
  address: string;
  telephoneNumber: string;
  email: string;
  setupInstruction: ClinicHl7SetupInstruction;
  existingExcellerisUserId: string;
  additionalSpecialInstructions: string;
  providerNamesAndMspNumbers: string;
  emrName: string;
  emrVersion: string;
  emrContact: string;
  emrTelephoneNumber: string;
  emrEmail: string;
  implementationDate: string;
  supportedContentTypes: ClinicHl7SupportedContentType[];
  fallbackFaxNumber: string;
};

type Hl7SetupAssets = {
  uiContent: ClinicHl7HealthCareProviderSetupUiContent | null;
  savedAt: string;
  missingFields: string[];
};

type Hl7SetupFieldErrors = Partial<Record<keyof Hl7SetupFormState, string>>;

function localIsoDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function createEmptyState(): Hl7SetupFormState {
  return {
    clinicName: "",
    primaryContact: "",
    address: "",
    telephoneNumber: "",
    email: "",
    setupInstruction: "NEW",
    existingExcellerisUserId: "",
    additionalSpecialInstructions: "",
    providerNamesAndMspNumbers: "",
    emrName: "",
    emrVersion: "",
    emrContact: "",
    emrTelephoneNumber: "",
    emrEmail: "",
    implementationDate: localIsoDate(),
    supportedContentTypes: [],
    fallbackFaxNumber: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function displayFieldLabel(key: string, fieldLabels?: Record<string, string>, fallback?: string) {
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
  if (missingFields.length === 0) return message;
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

function parseSupportedContentTypes(
  source: Record<string, unknown>,
  fallback: Record<string, unknown>,
): ClinicHl7SupportedContentType[] {
  const direct = source.supportedContentTypes;
  if (Array.isArray(direct)) {
    return direct.map((value) => asString(value) as ClinicHl7SupportedContentType).filter(Boolean);
  }

  const fallbackDirect = fallback["Supported Content Types"];
  if (typeof fallbackDirect === "string" && fallbackDirect.trim()) {
    return fallbackDirect
      .split(",")
      .map((item) => item.trim() as ClinicHl7SupportedContentType)
      .filter(Boolean);
  }

  return [];
}

function parseResponseState(response: ClinicHl7HealthCareProviderSetupResponse) {
  const saved = response.saved_values ?? {};
  const fallback = response.field_values ?? {};
  const source = isRecord(saved) && Object.keys(saved).length > 0 ? saved : fallback;
  const sourceRecord = source as Record<string, unknown>;
  const fallbackRecord = fallback as Record<string, unknown>;
  const current = createEmptyState();

  return {
    ...current,
    clinicName: asString(sourceRecord.clinicName) || asString(fallbackRecord["Clinic Name"]),
    primaryContact:
      asString(sourceRecord.primaryContact) || asString(fallbackRecord["Primary Contact"]),
    address: asString(sourceRecord.address) || asString(fallbackRecord.Address),
    telephoneNumber:
      asString(sourceRecord.telephoneNumber) || asString(fallbackRecord["Telephone Number"]),
    email: asString(sourceRecord.email) || asString(fallbackRecord.Email),
    setupInstruction:
      (asString(sourceRecord.setupInstruction) as ClinicHl7SetupInstruction) ||
      (asString(fallbackRecord["Set Up Instruction"]) as ClinicHl7SetupInstruction) ||
      current.setupInstruction,
    existingExcellerisUserId:
      asString(sourceRecord.existingExcellerisUserId) ||
      asString(fallbackRecord["Existing Excelleris User ID"]),
    additionalSpecialInstructions:
      asString(sourceRecord.additionalSpecialInstructions) ||
      asString(fallbackRecord["Additional Special Instructions"]),
    providerNamesAndMspNumbers:
      asString(sourceRecord.providerNamesAndMspNumbers) ||
      asString(fallbackRecord["Provider Names and MSP Numbers"]),
    emrName: asString(sourceRecord.emrName) || asString(fallbackRecord["EMR Name"]),
    emrVersion: asString(sourceRecord.emrVersion) || asString(fallbackRecord["EMR Version"]),
    emrContact: asString(sourceRecord.emrContact) || asString(fallbackRecord["EMR Contact"]),
    emrTelephoneNumber:
      asString(sourceRecord.emrTelephoneNumber) || asString(fallbackRecord["EMR Telephone Number"]),
    emrEmail: asString(sourceRecord.emrEmail) || asString(fallbackRecord["EMR Email"]),
    implementationDate:
      asString(sourceRecord.implementationDate) || asString(fallbackRecord["Implementation Date"]) || current.implementationDate,
    supportedContentTypes: parseSupportedContentTypes(sourceRecord, fallbackRecord),
    fallbackFaxNumber:
      asString(sourceRecord.fallbackFaxNumber) || asString(fallbackRecord["Fallback Fax Number"]),
  };
}

function Hl7SetupDialog({
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
  const [assets, setAssets] = useState<Hl7SetupAssets>({
    uiContent: null,
    savedAt: "",
    missingFields: [],
  });
  const [formState, setFormState] = useState<Hl7SetupFormState>(() => createEmptyState());
  const [fieldErrors, setFieldErrors] = useState<Hl7SetupFieldErrors>({});

  useEffect(() => {
    if (!open) return;

    if (!session?.accessToken) {
      setError("Please sign in to open the HL7 setup form.");
      return;
    }

    let active = true;
    setError("");
    setFieldErrors({});
    setLoading(true);

    fetchClinicHl7HealthCareProviderSetupForm(session.accessToken)
      .then((response) => {
        if (!active) return;

        setAssets({
          uiContent: response.ui_content,
          savedAt: response.saved_at,
          missingFields: response.missing_fields ?? [],
        });
        setFormState(parseResponseState(response));
      })
      .catch((fetchError) => {
        if (!active) return;

        setError(fetchError instanceof Error ? fetchError.message : "Could not load the HL7 setup form.");
        setAssets({ uiContent: null, savedAt: "", missingFields: [] });
        setFormState(createEmptyState());
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, session?.accessToken]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function validate(current: Hl7SetupFormState) {
    const nextErrors: Hl7SetupFieldErrors = {};
    const addRequired = (field: keyof Hl7SetupFormState, message: string) => {
      const value = current[field];
      if (typeof value === "string" && !value.trim()) {
        nextErrors[field] = message;
      }
    };

    addRequired("clinicName", "Clinic name is required.");
    addRequired("primaryContact", "Primary contact is required.");
    addRequired("address", "Address is required.");
    addRequired("telephoneNumber", "Telephone number is required.");
    if (current.telephoneNumber.trim() && !hasExactDigits(current.telephoneNumber, 10)) {
      nextErrors.telephoneNumber = "Telephone number must be a valid 10-digit number.";
    }
    addRequired("email", "Email is required.");
    if (current.email.trim() && !validateEmail(current.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    addRequired("implementationDate", "Implementation date is required.");
    addRequired("fallbackFaxNumber", "Fax number is required.");
    if (current.fallbackFaxNumber.trim() && !hasExactDigits(current.fallbackFaxNumber, 10)) {
      nextErrors.fallbackFaxNumber = "Fax number must be a valid 10-digit number.";
    }
    addRequired("providerNamesAndMspNumbers", "Provider names and MSP numbers are required.");
    addRequired("emrName", "EMR name is required.");
    addRequired("emrVersion", "EMR version is required.");
    addRequired("emrContact", "EMR contact is required.");
    addRequired("emrTelephoneNumber", "EMR telephone number is required.");
    if (current.emrTelephoneNumber.trim() && !hasExactDigits(current.emrTelephoneNumber, 10)) {
      nextErrors.emrTelephoneNumber = "EMR telephone number must be a valid 10-digit number.";
    }
    addRequired("emrEmail", "EMR email is required.");
    if (current.emrEmail.trim() && !validateEmail(current.emrEmail)) {
      nextErrors.emrEmail = "Enter a valid email address.";
    }

    if (current.setupInstruction === "ADD_EXISTING" && !current.existingExcellerisUserId.trim()) {
      nextErrors.existingExcellerisUserId = "Existing Excelleris user ID is required.";
    }

    if (current.supportedContentTypes.length === 0) {
      nextErrors.supportedContentTypes = "Select at least one content type.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("Please sign in to submit the form.");
      return;
    }

    const nextErrors = validate(formState);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please complete the required fields before submitting.");
      return;
    }

    const payload: ClinicHl7HealthCareProviderSetupRequest = {
      clinicName: formState.clinicName.trim(),
      primaryContact: formState.primaryContact.trim(),
      address: formState.address.trim(),
      telephoneNumber: digitsOnly(formState.telephoneNumber),
      email: formState.email.trim(),
      setupInstruction: formState.setupInstruction,
      existingExcellerisUserId:
        formState.setupInstruction === "ADD_EXISTING"
          ? formState.existingExcellerisUserId.trim()
          : null,
      additionalSpecialInstructions: formState.additionalSpecialInstructions.trim(),
      providerNamesAndMspNumbers: formState.providerNamesAndMspNumbers.trim(),
      emrName: formState.emrName.trim(),
      emrVersion: formState.emrVersion.trim(),
      emrContact: formState.emrContact.trim(),
      emrTelephoneNumber: digitsOnly(formState.emrTelephoneNumber),
      emrEmail: formState.emrEmail.trim(),
      implementationDate: formState.implementationDate,
      supportedContentTypes: formState.supportedContentTypes,
      fallbackFaxNumber: digitsOnly(formState.fallbackFaxNumber),
    };

    setSaving(true);
    setError("");

    try {
      const response = await submitClinicHl7HealthCareProviderSetupForm(session.accessToken, payload);
      const missingFields = response.missing_fields ?? [];

      setAssets({
        uiContent: response.ui_content,
        savedAt: response.saved_at,
        missingFields,
      });

      if (missingFields.length > 0) {
        setError(
          formatResponseError(
            "The backend returned the form with missing fields.",
            missingFields.map(humanizeKey),
          ),
        );
        return;
      }

      setFormState(parseResponseState(response));
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit the form.");
    } finally {
      setSaving(false);
    }
  }

  const fieldLabels = assets.uiContent?.field_labels ?? {};
  const setupInstructionOptions = assets.uiContent?.setup_instruction_options ?? [];
  const supportedContentOptions = assets.uiContent?.supported_content_options ?? [];

  if (!open) return null;

  const showExistingUserId = formState.setupInstruction === "ADD_EXISTING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-border bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 py-3">
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">{FORM_TITLE}</h2>
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
              <section className="rounded-3xl border border-border p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField
                    label={displayFieldLabel("clinicName", fieldLabels, "Clinic name")}
                    required
                    error={fieldErrors.clinicName}
                  >
                    <Input
                      value={formState.clinicName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          clinicName: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("primaryContact", fieldLabels, "Primary contact")}
                    required
                    error={fieldErrors.primaryContact}
                  >
                    <Input
                      value={formState.primaryContact}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          primaryContact: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("telephoneNumber", fieldLabels, "Telephone number")}
                    required
                    error={fieldErrors.telephoneNumber}
                  >
                    <Input
                      type="tel"
                      value={formState.telephoneNumber}
                      onChange={(event) =>
                        updateLiveTenDigitField(
                          setFormState,
                          setFieldErrors,
                          "telephoneNumber",
                          event.target.value,
                          "Telephone number",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("email", fieldLabels, "Email")}
                    required
                    error={fieldErrors.email}
                  >
                    <Input
                      type="email"
                      value={formState.email}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, email: event.target.value.trim() }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("address", fieldLabels, "Address")}
                    required
                    error={fieldErrors.address}
                  >
                    <textarea
                      rows={2}
                      value={formState.address}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          address: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                      className="min-h-[84px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "additionalSpecialInstructions",
                      fieldLabels,
                      "Additional special instructions",
                    )}
                    error={fieldErrors.additionalSpecialInstructions}
                  >
                    <textarea
                      rows={2}
                      value={formState.additionalSpecialInstructions}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          additionalSpecialInstructions: event.target.value,
                        }))
                      }
                      className="min-h-[84px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </DialogField>
                </div>
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground">Setup instructions</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {setupInstructionOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormState((current) => ({
                          ...current,
                          setupInstruction: option.value,
                        }))
                      }
                      className={cn(
                        "w-full rounded-2xl border px-4 py-4 text-left transition",
                        formState.setupInstruction === option.value
                          ? "border-primary shadow-sm"
                          : "border-border hover:border-primary/30",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full border",
                            formState.setupInstruction === option.value
                              ? "border-primary bg-primary"
                              : "border-border",
                          )}
                        >
                          {formState.setupInstruction === option.value ? (
                            <span className="h-2.5 w-2.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{option.label}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {showExistingUserId ? (
                  <div className="mt-5">
                    <DialogField
                      label={displayFieldLabel(
                        "existingExcellerisUserId",
                        fieldLabels,
                        "Existing Excelleris user ID",
                      )}
                      required
                      error={fieldErrors.existingExcellerisUserId}
                    >
                      <Input
                        value={formState.existingExcellerisUserId}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            existingExcellerisUserId: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                  </div>
                ) : null}
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField
                    label={displayFieldLabel(
                      "providerNamesAndMspNumbers",
                      fieldLabels,
                      "Health care provider names and MSP numbers",
                    )}
                    required
                    error={fieldErrors.providerNamesAndMspNumbers}
                    className="md:col-span-2"
                  >
                    <textarea
                      rows={4}
                      value={formState.providerNamesAndMspNumbers}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          providerNamesAndMspNumbers: event.target.value,
                        }))
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </DialogField>

                  <DialogField label={displayFieldLabel("emrName", fieldLabels, "EMR name")} required error={fieldErrors.emrName}>
                    <Input
                      value={formState.emrName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          emrName: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("emrVersion", fieldLabels, "EMR version")}
                    required
                    error={fieldErrors.emrVersion}
                  >
                    <Input
                      value={formState.emrVersion}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, emrVersion: event.target.value }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("emrContact", fieldLabels, "EMR contact")}
                    required
                    error={fieldErrors.emrContact}
                  >
                    <Input
                      value={formState.emrContact}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          emrContact: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("emrTelephoneNumber", fieldLabels, "EMR telephone number")}
                    required
                    error={fieldErrors.emrTelephoneNumber}
                  >
                    <Input
                      type="tel"
                      value={formState.emrTelephoneNumber}
                      onChange={(event) =>
                        updateLiveTenDigitField(
                          setFormState,
                          setFieldErrors,
                          "emrTelephoneNumber",
                          event.target.value,
                          "EMR telephone number",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("emrEmail", fieldLabels, "EMR email")}
                    required
                    error={fieldErrors.emrEmail}
                  >
                    <Input
                      type="email"
                      value={formState.emrEmail}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, emrEmail: event.target.value.trim() }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("implementationDate", fieldLabels, "Implementation date")}
                    required
                    error={fieldErrors.implementationDate}
                  >
                    <Input
                      type="date"
                      value={formState.implementationDate}
                      onChange={(event) =>
                        updateLiveFutureDateField(
                          setFormState,
                          setFieldErrors,
                          "implementationDate",
                          event.target.value,
                          "Implementation date",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "fallbackFaxNumber",
                      fieldLabels,
                      "Fax number for unsupported lab content",
                    )}
                    required
                    error={fieldErrors.fallbackFaxNumber}
                  >
                    <Input
                      type="tel"
                      value={formState.fallbackFaxNumber}
                      onChange={(event) =>
                        updateLiveTenDigitField(
                          setFormState,
                          setFieldErrors,
                          "fallbackFaxNumber",
                          event.target.value,
                          "Fax number for unsupported lab content",
                          "fax number",
                        )
                      }
                    />
                  </DialogField>

                  <div className="md:col-span-2 space-y-2">
                    <span className="text-sm font-medium text-foreground">
                      {displayFieldLabel("supportedContentTypes", fieldLabels, "Supported content types")}
                      <span className="ml-1 text-destructive">*</span>
                    </span>
                    <div className="grid gap-3 md:grid-cols-2">
                      {supportedContentOptions.map((option) => {
                        const checked = formState.supportedContentTypes.includes(option.value);
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setFormState((current) => ({
                                ...current,
                                supportedContentTypes: checked
                                  ? current.supportedContentTypes.filter((value) => value !== option.value)
                                  : [...current.supportedContentTypes, option.value],
                              }))
                            }
                            className={cn(
                              "w-full rounded-2xl border px-4 py-4 text-left transition",
                              checked ? "border-primary shadow-sm" : "border-border hover:border-primary/30",
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded border",
                                  checked ? "border-primary bg-primary" : "border-border",
                                )}
                              >
                                {checked ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{option.label}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.supportedContentTypes ? (
                      <p className="text-xs text-destructive">{fieldErrors.supportedContentTypes}</p>
                    ) : null}
                  </div>
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
                    {assets.missingFields.map(humanizeKey).join(", ")}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Apply application"
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

export function Hl7HealthCareProviderSetupSection({
  autoOpen = false,
  onRequestClose,
}: {
  autoOpen?: boolean;
  onRequestClose?: () => void;
}) {
  const session = readClinicLoginSession();
  const [open, setOpen] = useState(autoOpen);

  return (
    <>
      {autoOpen ? null : (
        <section className="overflow-hidden rounded-2xl border border-border bg-white">
          <div className="px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-white">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{FORM_TITLE}</p>
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
      )}

      <Hl7SetupDialog
        open={open}
        onClose={() => {
          setOpen(false);
          onRequestClose?.();
        }}
      />
    </>
  );
}
