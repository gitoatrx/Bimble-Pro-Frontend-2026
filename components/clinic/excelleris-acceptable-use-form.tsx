"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { hasExactDigits } from "@/lib/form-validation";
import {
  fetchClinicExcellerisAcceptableUseForm,
  submitClinicExcellerisAcceptableUseForm,
  type ClinicExcellerisDeliveryMethod,
  type ClinicExcellerisRequest,
  type ClinicExcellerisResponse,
  type ClinicExcellerisUiContent,
} from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { SignaturePad, digitsOnly } from "@/components/doctor/doctor-form-shared";

const FORM_TITLE = "Excelleris Electronic Distribution Application";

type ExcellerisFormState = {
  providerName: string;
  mspNumber: string;
  clinicNameAndAddress: string;
  dateSigned: string;
  telephoneNumber: string;
  emailAddress: string;
  faxNumber: string;
  deliveryMethod: ClinicExcellerisDeliveryMethod;
  launchpadUserName1: string;
  launchpadUserName2: string;
  launchpadUserName3: string;
  emrName: string;
  emrFaxNumber: string;
  reportFaxNumber: string;
  confirmAcknowledgement: boolean;
  signatureLabel: string;
  signatureDataUrl: string;
};

type ExcellerisFieldErrors = Partial<Record<keyof ExcellerisFormState, string>>;
type ExcellerisAssets = {
  uiContent: ClinicExcellerisUiContent | null;
  savedAt: string;
  missingFields: string[];
};

function localIsoDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function createEmptyState(): ExcellerisFormState {
  return {
    providerName: "",
    mspNumber: "",
    clinicNameAndAddress: "",
    dateSigned: localIsoDate(),
    telephoneNumber: "",
    emailAddress: "",
    faxNumber: "",
    deliveryMethod: "LAUNCHPAD",
    launchpadUserName1: "",
    launchpadUserName2: "",
    launchpadUserName3: "",
    emrName: "",
    emrFaxNumber: "",
    reportFaxNumber: "",
    confirmAcknowledgement: false,
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

function ChoiceCard({
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
        checked ? "border-primary shadow-sm" : "border-border hover:border-primary/30",
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

function parseSignature(
  source: Record<string, unknown>,
  response: ClinicExcellerisResponse,
) {
  const nestedSignature = isRecord(source.signature) ? source.signature : null;

  return {
    signatureDataUrl:
      asString(source.signatureDataUrl) ||
      asString(source.signature_data_url) ||
      asString(response.signature_data_url) ||
      asString(nestedSignature?.signatureDataUrl) ||
      asString(nestedSignature?.signature_data_url),
    signatureLabel:
      asString(source.signatureLabel) ||
      asString(source.signature_label) ||
      asString(response.signature_label) ||
      asString(nestedSignature?.signatureLabel) ||
      asString(nestedSignature?.signature_label),
  };
}

function parseResponseState(response: ClinicExcellerisResponse) {
  const saved = response.saved_values ?? {};
  const fallback = response.field_values ?? {};
  const source = isRecord(saved) && Object.keys(saved).length > 0 ? saved : fallback;
  const sourceRecord = source as Record<string, unknown>;
  const fallbackRecord = fallback as Record<string, unknown>;
  const signature = parseSignature(sourceRecord, response);
  const current = createEmptyState();

  const deliveryMethod = (() => {
    const direct = asString(sourceRecord.deliveryMethod) || asString(sourceRecord.delivery_method);
    if (direct) return direct as ClinicExcellerisDeliveryMethod;
    if (asBoolean(fallbackRecord.Launchpad)) return "LAUNCHPAD";
    if (asBoolean(fallbackRecord.EMR)) return "EMR";
    if (asBoolean(fallbackRecord.Fax)) return "FAX";
    return current.deliveryMethod;
  })();

  const launchpadNames = Array.isArray(sourceRecord.launchpadUserNames)
    ? sourceRecord.launchpadUserNames.map((value) => asString(value))
    : [
        asString(fallbackRecord["User First and Last Name 1"]),
        asString(fallbackRecord["User First and Last Name 2"]),
        asString(fallbackRecord["User First and Last Name 3"]),
      ];

  return {
    ...current,
    providerName: asString(sourceRecord.providerName) || asString(fallbackRecord["First & Last Name"]),
    mspNumber: asString(sourceRecord.mspNumber) || asString(fallbackRecord["MSP Number"]),
    clinicNameAndAddress:
      asString(sourceRecord.clinicNameAndAddress) ||
      asString(fallbackRecord["Clinic Name & Address"]),
    dateSigned: asString(sourceRecord.dateSigned) || asString(fallbackRecord.Date) || current.dateSigned,
    telephoneNumber:
      asString(sourceRecord.telephoneNumber) || asString(fallbackRecord["Telephone Number"]),
    emailAddress: asString(sourceRecord.emailAddress) || asString(fallbackRecord["Email Address"]),
    faxNumber: asString(sourceRecord.faxNumber) || asString(fallbackRecord["Fax Number"]),
    deliveryMethod,
    launchpadUserName1: launchpadNames[0] || "",
    launchpadUserName2: launchpadNames[1] || "",
    launchpadUserName3: launchpadNames[2] || "",
    emrName: asString(sourceRecord.emrName) || asString(fallbackRecord["EMR Name"]),
    emrFaxNumber: asString(sourceRecord.emrFaxNumber) || asString(fallbackRecord["EMR Fax Number"]),
    reportFaxNumber: asString(sourceRecord.reportFaxNumber) || asString(fallbackRecord["Report Fax Number"]),
    confirmAcknowledgement:
      typeof sourceRecord.confirmAcknowledgement === "boolean"
        ? sourceRecord.confirmAcknowledgement
        : asBoolean(fallbackRecord["confirmAcknowledgement"]) ||
          asBoolean(response.confirm_acknowledgement),
    signatureLabel:
      signature.signatureLabel || asString(sourceRecord.providerName) || current.signatureLabel,
    signatureDataUrl: signature.signatureDataUrl,
  };
}

function ExcellerisDialog({
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
  const [assets, setAssets] = useState<ExcellerisAssets>({
    uiContent: null,
    savedAt: "",
    missingFields: [],
  });
  const [formState, setFormState] = useState<ExcellerisFormState>(() => createEmptyState());
  const [fieldErrors, setFieldErrors] = useState<ExcellerisFieldErrors>({});
  const signatureDataUrlRef = useRef("");

  useEffect(() => {
    if (!open) return;

    if (!session?.accessToken) {
      setError("Please sign in to open the Excelleris form.");
      return;
    }

    let active = true;
    setError("");
    setFieldErrors({});
    setLoading(true);

    fetchClinicExcellerisAcceptableUseForm(session.accessToken)
      .then((response) => {
        if (!active) return;

        setAssets({
          uiContent: response.ui_content,
          savedAt: response.saved_at,
          missingFields: response.missing_fields ?? [],
        });
        const nextState = parseResponseState(response);
        setFormState(nextState);
        signatureDataUrlRef.current = nextState.signatureDataUrl;
      })
      .catch((fetchError) => {
        if (!active) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not load the Excelleris form.",
        );
        setAssets({ uiContent: null, savedAt: "", missingFields: [] });
        setFormState(createEmptyState());
        signatureDataUrlRef.current = "";
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
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  function validate(current: ExcellerisFormState) {
    const nextErrors: ExcellerisFieldErrors = {};
    const addRequired = (field: keyof ExcellerisFormState, message: string) => {
      if (typeof current[field] === "string" && !current[field].trim()) {
        nextErrors[field] = message;
      }
    };

    addRequired("providerName", "First and last name is required.");
    addRequired("mspNumber", "MSP number is required.");
    addRequired("clinicNameAndAddress", "Clinic name and address is required.");
    addRequired("dateSigned", "Date is required.");
    addRequired("telephoneNumber", "Telephone number is required.");
    if (current.telephoneNumber.trim() && !hasExactDigits(current.telephoneNumber, 10)) {
      nextErrors.telephoneNumber = "Telephone number must be a valid 10-digit number.";
    }
    addRequired("emailAddress", "Email address is required.");
    addRequired("faxNumber", "Fax number is required.");
    if (current.faxNumber.trim() && !hasExactDigits(current.faxNumber, 10)) {
      nextErrors.faxNumber = "Fax number must be a valid 10-digit number.";
    }
    addRequired("signatureLabel", "Signature label is required.");
    addRequired("signatureDataUrl", "Signature is required.");

    if (current.deliveryMethod === "LAUNCHPAD") {
      addRequired("launchpadUserName1", "At least one Launchpad user is required.");
    }

    if (current.deliveryMethod === "EMR") {
      addRequired("emrName", "EMR name is required.");
      addRequired("emrFaxNumber", "EMR fax number is required.");
      if (current.emrFaxNumber.trim() && !hasExactDigits(current.emrFaxNumber, 10)) {
        nextErrors.emrFaxNumber = "EMR fax number must be a valid 10-digit number.";
      }
    }

    if (current.deliveryMethod === "FAX") {
      addRequired("reportFaxNumber", "Report fax number is required.");
      if (current.reportFaxNumber.trim() && !hasExactDigits(current.reportFaxNumber, 10)) {
        nextErrors.reportFaxNumber = "Report fax number must be a valid 10-digit number.";
      }
    }

    if (!current.confirmAcknowledgement) {
      nextErrors.confirmAcknowledgement = "You must agree to the acknowledgement.";
    }

    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.accessToken) {
      setError("Please sign in to submit the application.");
      return;
    }

    const signatureValue = signatureDataUrlRef.current || formState.signatureDataUrl;
    const submitState = {
      ...formState,
      signatureDataUrl: signatureValue,
    };
    const nextErrors = validate(submitState);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError("Please complete the required fields before submitting.");
      return;
    }

    const launchpadUserNames = [
      submitState.launchpadUserName1.trim(),
      submitState.launchpadUserName2.trim(),
      submitState.launchpadUserName3.trim(),
    ].filter(Boolean);

    const payload: ClinicExcellerisRequest = {
      providerName: submitState.providerName.trim(),
      mspNumber: submitState.mspNumber.trim(),
      clinicNameAndAddress: submitState.clinicNameAndAddress.trim(),
      dateSigned: submitState.dateSigned,
      telephoneNumber: digitsOnly(submitState.telephoneNumber),
      emailAddress: submitState.emailAddress.trim(),
      faxNumber: digitsOnly(submitState.faxNumber),
      deliveryMethod: submitState.deliveryMethod,
      launchpadUserNames,
      emrName: submitState.deliveryMethod === "EMR" ? submitState.emrName.trim() : null,
      emrFaxNumber: submitState.deliveryMethod === "EMR" ? digitsOnly(submitState.emrFaxNumber) : null,
      reportFaxNumber:
        submitState.deliveryMethod === "FAX" ? digitsOnly(submitState.reportFaxNumber) : null,
      confirmAcknowledgement: true,
      signature: {
        signatureDataUrl: signatureValue.trim(),
        signatureLabel: submitState.signatureLabel.trim(),
      },
    };

    setSaving(true);
    setError("");

    try {
      const response = await submitClinicExcellerisAcceptableUseForm(session.accessToken, payload);
      const missingFields = response.missing_fields ?? [];

      setAssets({
        uiContent: response.ui_content,
        savedAt: response.saved_at,
        missingFields,
      });

      if (missingFields.length > 0) {
        setError(
          formatResponseError(
            "The backend returned the application with missing fields.",
            missingFields.map(humanizeKey),
          ),
        );
        return;
      }

      setFormState(parseResponseState(response));
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the Excelleris form.",
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldLabels = assets.uiContent?.field_labels ?? {};
  const deliveryMethodOptions = assets.uiContent?.delivery_method_options ?? [];
  const acknowledgements = assets.uiContent?.acknowledgements ?? [];
  const consentLabel =
    assets.uiContent?.consent_label ??
    "I have read and agree to the acceptable use acknowledgement above.";

  if (!open) {
    return null;
  }

  const showLaunchpad = formState.deliveryMethod === "LAUNCHPAD";
  const showEmr = formState.deliveryMethod === "EMR";
  const showFax = formState.deliveryMethod === "FAX";

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
                    label={displayFieldLabel("providerName", fieldLabels, "First and last name")}
                    required
                    error={fieldErrors.providerName}
                  >
                    <Input
                      value={formState.providerName}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, providerName: event.target.value }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("mspNumber", fieldLabels, "MSP number")}
                    required
                    error={fieldErrors.mspNumber}
                  >
                    <Input
                      value={formState.mspNumber}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, mspNumber: digitsOnly(event.target.value) }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    className="md:col-span-2"
                    label={displayFieldLabel("clinicNameAndAddress", fieldLabels, "Clinic name and address of practice")}
                    required
                    error={fieldErrors.clinicNameAndAddress}
                  >
                    <textarea
                      rows={4}
                      value={formState.clinicNameAndAddress}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          clinicNameAndAddress: event.target.value,
                        }))
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </DialogField>
                  <DialogField label={displayFieldLabel("dateSigned", fieldLabels, "Date")} required error={fieldErrors.dateSigned}>
                    <Input
                      type="date"
                      value={formState.dateSigned}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, dateSigned: event.target.value }))
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
                        setFormState((current) => ({
                          ...current,
                          telephoneNumber: digitsOnly(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel("emailAddress", fieldLabels, "Email address")}
                    required
                    error={fieldErrors.emailAddress}
                  >
                    <Input
                      type="email"
                      value={formState.emailAddress}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, emailAddress: event.target.value }))
                      }
                    />
                  </DialogField>
                  <DialogField label={displayFieldLabel("faxNumber", fieldLabels, "Fax number")} required error={fieldErrors.faxNumber}>
                    <Input
                      type="tel"
                      value={formState.faxNumber}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, faxNumber: digitsOnly(event.target.value) }))
                      }
                    />
                  </DialogField>
                </div>
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-white">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {displayFieldLabel("deliveryMethod", fieldLabels, "Report delivery method")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Choose how reports should be delivered for this location.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {deliveryMethodOptions.map((option) => (
                    <ChoiceCard
                      key={option.value}
                      label={option.label}
                      summary={option.summary_text}
                      checked={formState.deliveryMethod === option.value}
                      onSelect={() =>
                        setFormState((current) => ({ ...current, deliveryMethod: option.value }))
                      }
                    />
                  ))}
                </div>

                {showLaunchpad ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <DialogField
                      label={displayFieldLabel("launchpadUserNames", fieldLabels, "Authorized staff first and last names")}
                      required
                      error={fieldErrors.launchpadUserName1}
                    >
                      <Input
                        value={formState.launchpadUserName1}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            launchpadUserName1: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                    <DialogField label="Authorized staff 2">
                      <Input
                        value={formState.launchpadUserName2}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            launchpadUserName2: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                    <DialogField label="Authorized staff 3">
                      <Input
                        value={formState.launchpadUserName3}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            launchpadUserName3: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                  </div>
                ) : null}

                {showEmr ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <DialogField label={displayFieldLabel("emrName", fieldLabels, "EMR name")} required error={fieldErrors.emrName}>
                      <Input
                        value={formState.emrName}
                        onChange={(event) =>
                          setFormState((current) => ({ ...current, emrName: event.target.value }))
                        }
                      />
                    </DialogField>
                    <DialogField
                      label={displayFieldLabel("emrFaxNumber", fieldLabels, "EMR fax number")}
                      required
                      error={fieldErrors.emrFaxNumber}
                    >
                      <Input
                        type="tel"
                        value={formState.emrFaxNumber}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            emrFaxNumber: digitsOnly(event.target.value),
                          }))
                        }
                      />
                    </DialogField>
                  </div>
                ) : null}

                {showFax ? (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <DialogField
                      label={displayFieldLabel("reportFaxNumber", fieldLabels, "Report fax number")}
                      required
                      error={fieldErrors.reportFaxNumber}
                    >
                      <Input
                        type="tel"
                        value={formState.reportFaxNumber}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            reportFaxNumber: digitsOnly(event.target.value),
                          }))
                        }
                      />
                    </DialogField>
                  </div>
                ) : null}
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Acknowledgement</p>
                    <p className="text-xs text-muted-foreground">Review the acknowledgements below and confirm agreement before signing.</p>
                  </div>

                  <div className="space-y-3">
                    {acknowledgements.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-border px-4 py-4">
                        <p className="text-sm font-semibold text-foreground">{item.summary_text}</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.full_text}</p>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-border px-4 py-4">
                    <input
                      type="checkbox"
                      checked={formState.confirmAcknowledgement}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          confirmAcknowledgement: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm leading-6 text-foreground">{consentLabel}</span>
                  </label>
                  {fieldErrors.confirmAcknowledgement ? (
                    <p className="text-xs text-destructive">{fieldErrors.confirmAcknowledgement}</p>
                  ) : null}
                </div>
              </section>

              <section className="space-y-4">
                <DialogField label="Signature label" required error={fieldErrors.signatureLabel}>
                  <Input
                    value={formState.signatureLabel}
                    onChange={(event) =>
                      setFormState((current) => ({ ...current, signatureLabel: event.target.value }))
                    }
                  />
                </DialogField>

                <DialogField label="Signature" required error={fieldErrors.signatureDataUrl}>
                  <SignaturePad
                    value={formState.signatureDataUrl}
                    onChange={(value) => {
                      signatureDataUrlRef.current = value;
                      setFormState((current) => ({ ...current, signatureDataUrl: value }));
                    }}
                  />
                </DialogField>
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

export function ExcellerisAcceptableUseSection() {
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

      <ExcellerisDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
