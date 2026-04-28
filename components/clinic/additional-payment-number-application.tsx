"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  hasExactDigits,
  updateLiveFutureDateField,
  updateLiveTenDigitField,
} from "@/lib/form-validation";
import {
  fetchClinicPayment2876Form,
  submitClinicPayment2876Form,
  type ClinicPayment2876Modality,
  type ClinicPayment2876Request,
  type ClinicPayment2876Response,
  type ClinicPayment2876UiContent,
} from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { SignaturePad, digitsOnly } from "@/components/doctor/doctor-form-shared";

const FORM_TITLE = "Application for Additional Payment Number";

type Payment2876FormState = {
  mspPractitionerNumber: string;
  currentFullNameOrGroupName: string;
  currentMspPaymentNumber1: string;
  currentMspPaymentNumber2: string;
  currentMspPaymentNumber3: string;
  currentMspPaymentNumber4: string;
  currentPaymentMailingAddress: string;
  contractName: string;
  paymentModality: ClinicPayment2876Modality;
  dataCentreNumber: string;
  effectiveDate: string;
  responsiblePractitionerMspNumber: string;
  responsiblePractitionerName: string;
  telephoneNumber: string;
  faxNumber: string;
  emailAddress: string;
  serviceDescription: string;
  encounterReportingOnly: boolean;
  signatureLabel: string;
  signatureDataUrl: string;
};

type Payment2876FieldErrors = Partial<Record<keyof Payment2876FormState, string>>;
type PaymentDialogMode = "apply" | "update";

type Payment2876Assets = {
  uiContent: ClinicPayment2876UiContent | null;
  savedAt: string;
  missingFields: string[];
};

function localIsoDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

function createEmptyState(): Payment2876FormState {
  return {
    mspPractitionerNumber: "",
    currentFullNameOrGroupName: "",
    currentMspPaymentNumber1: "",
    currentMspPaymentNumber2: "",
    currentMspPaymentNumber3: "",
    currentMspPaymentNumber4: "",
    currentPaymentMailingAddress: "",
    contractName: "",
    paymentModality: "CONTRACT",
    dataCentreNumber: "",
    effectiveDate: localIsoDate(),
    responsiblePractitionerMspNumber: "",
    responsiblePractitionerName: "",
    telephoneNumber: "",
    faxNumber: "",
    emailAddress: "",
    serviceDescription: "",
    encounterReportingOnly: false,
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

function toDateInput(value: string | null | undefined) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 10);
  }

  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 10);
}

function combineDateParts(year: string, month: string, day: string) {
  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function pickString(
  source: Record<string, unknown>,
  fallback: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = asString(source[key]);
    if (value) return value;
  }

  for (const key of keys) {
    const value = asString(fallback[key]);
    if (value) return value;
  }

  return "";
}

function parseSignature(
  source: Record<string, unknown>,
  response: ClinicPayment2876Response,
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

function parseResponseState(response: ClinicPayment2876Response) {
  const saved = response.saved_values ?? {};
  const fallback = response.field_values ?? {};
  const source = isRecord(saved) && Object.keys(saved).length > 0 ? saved : fallback;
  const sourceRecord = source as Record<string, unknown>;
  const fallbackRecord = fallback as Record<string, unknown>;
  const signature = parseSignature(source, response);
  const current = createEmptyState();
  const paymentModalitySource =
    asString(sourceRecord.paymentModality) ||
    asString(sourceRecord.payment_modality) ||
    asString(fallbackRecord["Type of Payment"]);

  const paymentModality = (() => {
    const normalized = paymentModalitySource.toLowerCase();
    if (normalized.includes("sessional")) return "SESSIONAL" as ClinicPayment2876Modality;
    if (normalized.includes("salary")) return "SALARY" as ClinicPayment2876Modality;
    if (normalized.includes("contract")) return "CONTRACT" as ClinicPayment2876Modality;
    return current.paymentModality;
  })();

  const savedNumbers = Array.isArray(source.currentMspPaymentNumbers)
    ? source.currentMspPaymentNumbers
        .map((value) => asString(value))
        .filter(Boolean)
        .slice(0, 4)
    : [];

  const fallbackNumbers = [
    pickString(source, fallback, "currentMspPaymentNumber1", "Current MSP Payment Number 1"),
    pickString(source, fallback, "currentMspPaymentNumber2", "Current MSP Payment Number 2"),
    pickString(source, fallback, "currentMspPaymentNumber3", "Current MSP Payment Number 3"),
    pickString(source, fallback, "currentMspPaymentNumber4", "Current MSP Payment Number 4"),
  ];

  const paymentNumbers = [
    savedNumbers[0] || fallbackNumbers[0] || "",
    savedNumbers[1] || fallbackNumbers[1] || "",
    savedNumbers[2] || fallbackNumbers[2] || "",
    savedNumbers[3] || fallbackNumbers[3] || "",
  ];

  return {
    ...current,
    mspPractitionerNumber: pickString(source, fallback, "mspPractitionerNumber", "MSP Practitioner Number"),
    currentFullNameOrGroupName: pickString(
      source,
      fallback,
      "currentFullNameOrGroupName",
      "Current Full Name or Group",
    ),
    currentMspPaymentNumber1: paymentNumbers[0],
    currentMspPaymentNumber2: paymentNumbers[1],
    currentMspPaymentNumber3: paymentNumbers[2],
    currentMspPaymentNumber4: paymentNumbers[3],
    currentPaymentMailingAddress: pickString(
      source,
      fallback,
      "currentPaymentMailingAddress",
      "Mailing Address",
    ),
    contractName: pickString(source, fallback, "contractName", "Service_Contract_Name"),
    paymentModality,
    dataCentreNumber: pickString(source, fallback, "dataCentreNumber", "Data_Centre_Number"),
    effectiveDate:
      toDateInput(asString(sourceRecord.effectiveDate)) ||
      combineDateParts(
        asString(fallbackRecord.Effective_Date_YYYY),
        asString(fallbackRecord.Effective_Date_MM),
        asString(fallbackRecord.Effective_Date_DD),
      ) ||
      current.effectiveDate,
    responsiblePractitionerMspNumber: pickString(
      source,
      fallback,
      "responsiblePractitionerMspNumber",
      "Responsible_Practitioners_Number",
    ),
    responsiblePractitionerName: pickString(
      source,
      fallback,
      "responsiblePractitionerName",
      "Name_of_Responsible_Physician",
    ),
    telephoneNumber: pickString(source, fallback, "telephoneNumber", "Telephone_Number"),
    faxNumber: pickString(source, fallback, "faxNumber", "Fax_Number"),
    emailAddress: pickString(source, fallback, "emailAddress", "Email_Address"),
    serviceDescription: pickString(source, fallback, "serviceDescription", "Service_Description"),
    encounterReportingOnly:
      typeof sourceRecord.encounterReportingOnly === "boolean"
        ? sourceRecord.encounterReportingOnly
        : asBoolean(sourceRecord["Reporting Only"]) || asBoolean(fallbackRecord["Reporting Only"]),
    signatureLabel:
      signature.signatureLabel ||
      pickString(
        source,
        fallback,
        "responsiblePractitionerName",
        "Name_of_Responsible_Physician",
        "currentFullNameOrGroupName",
        "Current Full Name or Group",
      ) ||
      current.signatureLabel,
    signatureDataUrl: signature.signatureDataUrl,
  };
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
  checked,
  onSelect,
}: {
  label: string;
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
        </div>
      </div>
    </button>
  );
}

function Payment2876Dialog({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: PaymentDialogMode;
  onClose: () => void;
}) {
  const session = readClinicLoginSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState<Payment2876Assets>({
    uiContent: null,
    savedAt: "",
    missingFields: [],
  });
  const [formState, setFormState] = useState<Payment2876FormState>(() => createEmptyState());
  const [fieldErrors, setFieldErrors] = useState<Payment2876FieldErrors>({});
  const signatureDataUrlRef = useRef("");

  useEffect(() => {
    if (!open) return;

    if (!session?.accessToken) {
      setError("Please sign in to open the Additional Payment Number form.");
      return;
    }

    let active = true;
    setError("");
    setFieldErrors({});

    if (mode === "apply") {
      setLoading(false);
      setAssets({
        uiContent: null,
        savedAt: "",
        missingFields: [],
      });
      setFormState(createEmptyState());
      signatureDataUrlRef.current = "";
      return () => {
        active = false;
      };
    }

    setLoading(true);

    fetchClinicPayment2876Form(session.accessToken)
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
            : "Could not load the Additional Payment Number form.",
        );
        setAssets({
          uiContent: null,
          savedAt: "",
          missingFields: [],
        });
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
  }, [mode, open, session?.accessToken]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function validate(current: Payment2876FormState) {
    const nextErrors: Payment2876FieldErrors = {};
    const addRequired = (field: keyof Payment2876FormState, message: string) => {
      const value = current[field];
      if (typeof value === "string" && !value.trim()) {
        nextErrors[field] = message;
      }
    };

    addRequired("mspPractitionerNumber", "MSP practitioner number is required.");
    addRequired("currentFullNameOrGroupName", "Current full name or group name is required.");
    addRequired("currentMspPaymentNumber1", "At least one current MSP payment number is required.");
    addRequired("currentPaymentMailingAddress", "Mailing address is required.");
    addRequired("contractName", "Contract name is required.");
    addRequired("dataCentreNumber", "Data centre number is required.");
    addRequired("effectiveDate", "Effective date is required.");
    addRequired(
      "responsiblePractitionerMspNumber",
      "Responsible practitioner MSP number is required.",
    );
    addRequired("responsiblePractitionerName", "Responsible practitioner name is required.");
    addRequired("telephoneNumber", "Telephone number is required.");
    if (current.telephoneNumber.trim() && !hasExactDigits(current.telephoneNumber, 10)) {
      nextErrors.telephoneNumber = "Telephone number must be a valid 10-digit number.";
    }
    addRequired("faxNumber", "Fax number is required.");
    if (current.faxNumber.trim() && !hasExactDigits(current.faxNumber, 10)) {
      nextErrors.faxNumber = "Fax number must be a valid 10-digit number.";
    }
    addRequired("emailAddress", "Email address is required.");
    addRequired("serviceDescription", "Service description is required.");
    addRequired("signatureLabel", "Signature label is required.");
    addRequired("signatureDataUrl", "Signature is required.");

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

    const paymentNumbers = [
      submitState.currentMspPaymentNumber1.trim(),
      submitState.currentMspPaymentNumber2.trim(),
      submitState.currentMspPaymentNumber3.trim(),
      submitState.currentMspPaymentNumber4.trim(),
    ].filter(Boolean);

    const payload: ClinicPayment2876Request = {
      mspPractitionerNumber: submitState.mspPractitionerNumber.trim(),
      currentFullNameOrGroupName: submitState.currentFullNameOrGroupName.trim(),
      currentMspPaymentNumbers: paymentNumbers,
      currentPaymentMailingAddress: submitState.currentPaymentMailingAddress.trim(),
      contractName: submitState.contractName.trim(),
      paymentModality: submitState.paymentModality,
      dataCentreNumber: submitState.dataCentreNumber.trim(),
      effectiveDate: submitState.effectiveDate,
      responsiblePractitionerMspNumber: submitState.responsiblePractitionerMspNumber.trim(),
      responsiblePractitionerName: submitState.responsiblePractitionerName.trim(),
      telephoneNumber: digitsOnly(submitState.telephoneNumber),
      faxNumber: digitsOnly(submitState.faxNumber),
      emailAddress: submitState.emailAddress.trim(),
      serviceDescription: submitState.serviceDescription.trim(),
      encounterReportingOnly: submitState.encounterReportingOnly,
      signature: {
        signatureDataUrl: signatureValue.trim(),
        signatureLabel: submitState.signatureLabel.trim(),
      },
    };

    setSaving(true);
    setError("");

    try {
      const response = await submitClinicPayment2876Form(session.accessToken, payload);
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
            missingFields.map((field) =>
              displayFieldLabel(field, response.ui_content.field_labels, humanizeKey(field)),
            ),
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
          : "Could not submit the application.",
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldLabels = assets.uiContent?.field_labels ?? {};
  const modalityOptions = assets.uiContent?.payment_modality_options ?? [
    { value: "CONTRACT", label: 'Contract ("Y" status)' },
    { value: "SESSIONAL", label: 'Sessional Arrangement ("Y" status)' },
    { value: "SALARY", label: 'Salary Contract ("Y" status)' },
  ];
  const notes = assets.uiContent?.notes ?? [];

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-border bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 px-6 py-3">
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            {FORM_TITLE}
          </h2>
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
                      "currentFullNameOrGroupName",
                      fieldLabels,
                      "Current full name or group name",
                    )}
                    required
                    error={fieldErrors.currentFullNameOrGroupName}
                  >
                    <Input
                      value={formState.currentFullNameOrGroupName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          currentFullNameOrGroupName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <div className="md:col-span-2 space-y-2">
                    <span className="text-sm font-medium text-foreground">
                      Current MSP payment number(s)
                      <span className="ml-1 text-destructive">*</span>
                    </span>
                    <div className="grid gap-4 md:grid-cols-2">
                      <DialogField
                        label="Payment number 1"
                        required
                        error={fieldErrors.currentMspPaymentNumber1}
                      >
                        <Input
                          value={formState.currentMspPaymentNumber1}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              currentMspPaymentNumber1: event.target.value,
                            }))
                          }
                        />
                      </DialogField>
                      <DialogField
                        label="Payment number 2"
                        error={fieldErrors.currentMspPaymentNumber2}
                      >
                        <Input
                          value={formState.currentMspPaymentNumber2}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              currentMspPaymentNumber2: event.target.value,
                            }))
                          }
                        />
                      </DialogField>
                      <DialogField
                        label="Payment number 3"
                        error={fieldErrors.currentMspPaymentNumber3}
                      >
                        <Input
                          value={formState.currentMspPaymentNumber3}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              currentMspPaymentNumber3: event.target.value,
                            }))
                          }
                        />
                      </DialogField>
                      <DialogField
                        label="Payment number 4"
                        error={fieldErrors.currentMspPaymentNumber4}
                      >
                        <Input
                          value={formState.currentMspPaymentNumber4}
                          onChange={(event) =>
                            setFormState((current) => ({
                              ...current,
                              currentMspPaymentNumber4: event.target.value,
                            }))
                          }
                        />
                      </DialogField>
                    </div>
                  </div>

                  <DialogField
                    label={displayFieldLabel(
                      "currentPaymentMailingAddress",
                      fieldLabels,
                      "Mailing address and postal code of current MSP payment number",
                    )}
                    required
                    error={fieldErrors.currentPaymentMailingAddress}
                  >
                    <Input
                      value={formState.currentPaymentMailingAddress}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          currentPaymentMailingAddress: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel("contractName", fieldLabels, "Contract name")}
                    required
                    error={fieldErrors.contractName}
                  >
                    <Input
                      value={formState.contractName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          contractName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>

                  <div className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-foreground">
                      {displayFieldLabel(
                        "paymentModality",
                        fieldLabels,
                        "Type of payment modality",
                      )}
                      <span className="ml-1 text-destructive">*</span>
                    </span>
                    <div className="grid gap-3 md:grid-cols-3">
                      {modalityOptions.map((option) => (
                        <ChoiceCard
                          key={option.value}
                          label={option.label}
                          checked={formState.paymentModality === option.value}
                          onSelect={() =>
                            setFormState((current) => ({
                              ...current,
                              paymentModality: option.value,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField
                    label={displayFieldLabel("dataCentreNumber", fieldLabels, "Data centre number")}
                    required
                    error={fieldErrors.dataCentreNumber}
                  >
                    <Input
                      value={formState.dataCentreNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          dataCentreNumber: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "effectiveDate",
                      fieldLabels,
                      "Effective date of additional payment number",
                    )}
                    required
                    error={fieldErrors.effectiveDate}
                  >
                    <Input
                      type="date"
                      value={formState.effectiveDate}
                      onChange={(event) =>
                        updateLiveFutureDateField(
                          setFormState,
                          setFieldErrors,
                          "effectiveDate",
                          event.target.value,
                          "Effective date",
                        )
                      }
                    />
                  </DialogField>

                  <DialogField
                    label={displayFieldLabel(
                      "responsiblePractitionerMspNumber",
                      fieldLabels,
                      "Responsible practitioner MSP number",
                    )}
                    required
                    error={fieldErrors.responsiblePractitionerMspNumber}
                  >
                    <Input
                      value={formState.responsiblePractitionerMspNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          responsiblePractitionerMspNumber: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label={displayFieldLabel(
                      "responsiblePractitionerName",
                      fieldLabels,
                      "Responsible practitioner or health authority representative name",
                    )}
                    required
                    error={fieldErrors.responsiblePractitionerName}
                  >
                    <Input
                      value={formState.responsiblePractitionerName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          responsiblePractitionerName: event.target.value,
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
                    label={displayFieldLabel("faxNumber", fieldLabels, "Fax number")}
                    required
                    error={fieldErrors.faxNumber}
                  >
                    <Input
                      type="tel"
                      value={formState.faxNumber}
                      onChange={(event) =>
                        updateLiveTenDigitField(
                          setFormState,
                          setFieldErrors,
                          "faxNumber",
                          event.target.value,
                          "Fax number",
                          "fax number",
                        )
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
                        setFormState((current) => ({
                          ...current,
                          emailAddress: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    className="md:col-span-2"
                    label={displayFieldLabel("serviceDescription", fieldLabels, "Service description")}
                    required
                    error={fieldErrors.serviceDescription}
                  >
                    <textarea
                      value={formState.serviceDescription}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          serviceDescription: event.target.value,
                        }))
                      }
                      rows={4}
                      className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </DialogField>

                  <label className="flex items-start gap-3 rounded-2xl border border-border px-4 py-4 md:col-span-2">
                    <input
                      type="checkbox"
                      checked={formState.encounterReportingOnly}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          encounterReportingOnly: event.target.checked,
                        }))
                      }
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm leading-6 text-foreground">
                      {displayFieldLabel(
                        "encounterReportingOnly",
                        fieldLabels,
                        "Payee to be used for encounter reporting only",
                      )}
                    </span>
                  </label>
                </div>
              </section>

              <section className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField label="Signature label" required error={fieldErrors.signatureLabel}>
                    <Input
                      value={formState.signatureLabel}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          signatureLabel: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <div className="hidden md:block" />
                </div>

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

              {notes.length > 0 ? (
                <div className="rounded-2xl border border-border px-4 py-3 text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Notes</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

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
                    {assets.missingFields
                      .map((field) =>
                        displayFieldLabel(field, fieldLabels, humanizeKey(field)),
                      )
                      .join(", ")}
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
                    mode === "apply" ? "Apply application" : "Update application"
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

export function AdditionalPaymentNumberApplicationSection({
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
                onClick={() => {
                  setOpen(true);
                }}
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

      <Payment2876Dialog
        open={open}
        mode="apply"
        onClose={() => {
          setOpen(false);
          onRequestClose?.();
        }}
      />
    </>
  );
}
