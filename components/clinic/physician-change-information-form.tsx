"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowRight, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchClinicPhysicianChangeInformationForm,
  submitClinicPhysicianChangeInformationForm,
  type ClinicPhysicianChangeInformationRequest,
  type ClinicPhysicianChangeInformationResponse,
  type ClinicPhysicianChangeOfficeHourSlot,
} from "@/lib/api/clinic-dashboard";
import { hasExactDigits } from "@/lib/form-validation";
import { readClinicLoginSession } from "@/lib/clinic/session";
import {
  capitalizeLeadingLetter,
  digitsOnly,
  normalizeNameInput,
  validateEmail,
  useLiveFormValidation,
} from "@/components/doctor/doctor-form-shared";

const FORM_TITLE = "Physician Change Information Form";
const FIXED_FORM_TYPE = "CHANGE";

const DAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type DayKey = (typeof DAYS)[number];

type PhysicianChangeOfficeHoursState = Record<DayKey, ClinicPhysicianChangeOfficeHourSlot>;

type PhysicianChangeFormState = {
  formType: string;
  name: string;
  mohBillingNumber: string;
  address: string;
  specialty: string;
  officeContactName: string;
  officePhone: string;
  officeFax: string;
  officePrivatePhone: string;
  officeEmailAddress: string;
  officeHours: PhysicianChangeOfficeHoursState;
  afterHoursPhone: string;
  afterHoursDescription: string;
  afterHoursBeeper: string;
  afterHoursCellPhone: string;
  afterHoursHomePhone: string;
  backupPhysicianNumber: string;
  backupName: string;
  backupPhone: string;
  hospitalAffiliation: string;
  hospitalPhone: string;
  otherAffiliation: string;
  otherPhone: string;
  specialHandling: string;
};

type PhysicianChangeAssets = {
  savedAt: string;
  missingFields: string[];
};

type PhysicianChangeFieldErrors = Partial<Record<keyof PhysicianChangeFormState, string>>;
type PhysicianChangeDialogMode = "apply" | "update";
type PhysicianChangePhoneField =
  | "officePhone"
  | "officeFax"
  | "officePrivatePhone"
  | "afterHoursPhone"
  | "afterHoursCellPhone"
  | "afterHoursHomePhone"
  | "backupPhone"
  | "hospitalPhone"
  | "otherPhone";

function createEmptyOfficeHours(): PhysicianChangeOfficeHoursState {
  const empty = { from: "", to: "", lunchFrom: "", lunchTo: "" };

  return {
    sunday: { ...empty },
    monday: { ...empty },
    tuesday: { ...empty },
    wednesday: { ...empty },
    thursday: { ...empty },
    friday: { ...empty },
    saturday: { ...empty },
  };
}

function createEmptyState(): PhysicianChangeFormState {
  return {
    formType: FIXED_FORM_TYPE,
    name: "",
    mohBillingNumber: "",
    address: "",
    specialty: "",
    officeContactName: "",
    officePhone: "",
    officeFax: "",
    officePrivatePhone: "",
    officeEmailAddress: "",
    officeHours: createEmptyOfficeHours(),
    afterHoursPhone: "",
    afterHoursDescription: "",
    afterHoursBeeper: "",
    afterHoursCellPhone: "",
    afterHoursHomePhone: "",
    backupPhysicianNumber: "",
    backupName: "",
    backupPhone: "",
    hospitalAffiliation: "",
    hospitalPhone: "",
    otherAffiliation: "",
    otherPhone: "",
    specialHandling: "",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
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

function OfficeHoursGrid({
  value,
  onChange,
}: {
  value: PhysicianChangeOfficeHoursState;
  onChange: (next: PhysicianChangeOfficeHoursState) => void;
}) {
  function updateDay(day: DayKey, field: keyof ClinicPhysicianChangeOfficeHourSlot, nextValue: string) {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: nextValue,
      },
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid-cols-[120px_repeat(4,minmax(0,1fr))]">
        <span />
        <span>From</span>
        <span>To</span>
        <span>Lunch from</span>
        <span>Lunch to</span>
      </div>

      {DAYS.map((day) => {
        const row = value[day];
        return (
          <div
            key={day}
            className="grid gap-3 md:grid-cols-[120px_repeat(4,minmax(0,1fr))] md:items-start"
          >
            <div className="pt-3 text-sm font-medium capitalize text-foreground">{day}</div>
            <Input
              type="time"
              value={row.from}
              onChange={(event) => updateDay(day, "from", event.target.value)}
            />
            <Input
              type="time"
              value={row.to}
              onChange={(event) => updateDay(day, "to", event.target.value)}
            />
            <Input
              type="time"
              value={row.lunchFrom}
              onChange={(event) => updateDay(day, "lunchFrom", event.target.value)}
            />
            <Input
              type="time"
              value={row.lunchTo}
              onChange={(event) => updateDay(day, "lunchTo", event.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}

function parseOfficeHourSlot(
  day: DayKey,
  source: Record<string, unknown>,
  fallback: Record<string, unknown>,
): ClinicPhysicianChangeOfficeHourSlot {
  const officeHours = isRecord(source.officeHours) ? source.officeHours : null;
  const nested = isRecord(officeHours?.[day]) ? (officeHours[day] as Record<string, unknown>) : null;
  const dayLabel = `${day[0].toUpperCase()}${day.slice(1)}`;

  return {
    from: asString(nested?.from) || asString(fallback[`${dayLabel} From`]),
    to: asString(nested?.to) || asString(fallback[`${dayLabel} To`]),
    lunchFrom: asString(nested?.lunchFrom) || asString(fallback[`${dayLabel} Lunch From`]),
    lunchTo: asString(nested?.lunchTo) || asString(fallback[`${dayLabel} Lunch To`]),
  };
}

function parseResponseState(response: ClinicPhysicianChangeInformationResponse) {
  const saved = response.saved_values ?? {};
  const fallback = response.field_values ?? {};
  const source = isRecord(saved) && Object.keys(saved).length > 0 ? saved : fallback;
  const current = createEmptyState();

  const sourceRecord = source as Record<string, unknown>;
  const fallbackRecord = fallback as Record<string, unknown>;

  const officeHours = createEmptyOfficeHours();
  for (const day of DAYS) {
    officeHours[day] = parseOfficeHourSlot(day, sourceRecord, fallbackRecord);
  }

  return {
    ...current,
    formType: asString(sourceRecord.formType) || asString(fallbackRecord["Form Type"]) || FIXED_FORM_TYPE,
    name: asString(sourceRecord.name) || asString(fallbackRecord.Name),
    mohBillingNumber:
      asString(sourceRecord.mohBillingNumber) || asString(fallbackRecord["MOH Billing Number"]),
    address: asString(sourceRecord.address) || asString(fallbackRecord.Address),
    specialty: asString(sourceRecord.specialty) || asString(fallbackRecord.Specialty),
    officeContactName:
      asString(sourceRecord.officeContactName) || asString(fallbackRecord["Office Contact Name"]),
    officePhone: asString(sourceRecord.officePhone) || asString(fallbackRecord["Office Phone"]),
    officeFax: asString(sourceRecord.officeFax) || asString(fallbackRecord["Office Fax"]),
    officePrivatePhone:
      asString(sourceRecord.officePrivatePhone) || asString(fallbackRecord["Office Private Phone"]),
    officeEmailAddress:
      asString(sourceRecord.officeEmailAddress) || asString(fallbackRecord["Office Email Address"]),
    officeHours,
    afterHoursPhone:
      asString(sourceRecord.afterHoursPhone) || asString(fallbackRecord["After Hours Phone"]),
    afterHoursDescription:
      asString(sourceRecord.afterHoursDescription) ||
      asString(fallbackRecord["After Hours Description"]),
    afterHoursBeeper:
      asString(sourceRecord.afterHoursBeeper) || asString(fallbackRecord["After Hours Beeper"]),
    afterHoursCellPhone:
      asString(sourceRecord.afterHoursCellPhone) || asString(fallbackRecord["After Hours Cell Phone"]),
    afterHoursHomePhone:
      asString(sourceRecord.afterHoursHomePhone) || asString(fallbackRecord["After Hours Home Phone"]),
    backupPhysicianNumber:
      asString(sourceRecord.backupPhysicianNumber) || asString(fallbackRecord["Backup Physician Number"]),
    backupName: asString(sourceRecord.backupName) || asString(fallbackRecord["Backup Name"]),
    backupPhone: asString(sourceRecord.backupPhone) || asString(fallbackRecord["Backup Phone"]),
    hospitalAffiliation:
      asString(sourceRecord.hospitalAffiliation) || asString(fallbackRecord["Hospital Affiliation"]),
    hospitalPhone: asString(sourceRecord.hospitalPhone) || asString(fallbackRecord["Hospital Phone"]),
    otherAffiliation: asString(sourceRecord.otherAffiliation) || asString(fallbackRecord["Other Affiliation"]),
    otherPhone: asString(sourceRecord.otherPhone) || asString(fallbackRecord["Other Phone"]),
    specialHandling: asString(sourceRecord.specialHandling) || asString(fallbackRecord["Special Handling"]),
  };
}

function PhysicianChangeDialog({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: PhysicianChangeDialogMode;
  onClose: () => void;
}) {
  const session = readClinicLoginSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState<PhysicianChangeAssets>({
    savedAt: "",
    missingFields: [],
  });
  const [formState, setFormState] = useState<PhysicianChangeFormState>(() => createEmptyState());
  const [fieldErrors, setFieldErrors] = useState<PhysicianChangeFieldErrors>({});
  const liveValidation = useLiveFormValidation(setFormState, setFieldErrors);

  function updatePhoneField(
    field: PhysicianChangePhoneField,
    nextValue: string,
    label: string,
    kind: "phone number" | "fax number" = "phone number",
  ) {
    liveValidation.updateTenDigitField(field, nextValue, label, kind);
  }

  useEffect(() => {
    if (!open) return;

    if (!session?.accessToken) {
      setError("Please sign in to open the Physician Change Information form.");
      return;
    }

    let active = true;
    setError("");
    setFieldErrors({});

    if (mode === "apply") {
      setLoading(false);
      setAssets({ savedAt: "", missingFields: [] });
      setFormState(createEmptyState());
      return () => {
        active = false;
      };
    }

    setLoading(true);

    fetchClinicPhysicianChangeInformationForm(session.accessToken)
      .then((response) => {
        if (!active) return;

        setAssets({
          savedAt: response.saved_at,
          missingFields: response.missing_fields ?? [],
        });
        setFormState(parseResponseState(response));
      })
      .catch((fetchError) => {
        if (!active) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not load the Physician Change Information form.",
        );
        setAssets({ savedAt: "", missingFields: [] });
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
  }, [mode, open, session?.accessToken]);

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

  function validate(current: PhysicianChangeFormState) {
    const nextErrors: PhysicianChangeFieldErrors = {};
    const addRequired = (field: keyof PhysicianChangeFormState, message: string) => {
      const value = current[field];
      if (typeof value === "string" && !value.trim()) {
        nextErrors[field] = message;
      }
    };

    addRequired("name", "Name is required.");
    addRequired("mohBillingNumber", "MOH billing number is required.");
    addRequired("address", "Address is required.");
    addRequired("specialty", "Specialty is required.");
    addRequired("officeContactName", "Office contact name is required.");
    addRequired("officePhone", "Office phone is required.");
    if (current.officePhone.trim() && !hasExactDigits(current.officePhone, 10)) {
      nextErrors.officePhone = "Office phone must be a valid 10-digit number.";
    }
    addRequired("officeFax", "Office fax is required.");
    if (current.officeFax.trim() && !hasExactDigits(current.officeFax, 10)) {
      nextErrors.officeFax = "Office fax must be a valid 10-digit number.";
    }
    addRequired("officePrivatePhone", "Office private phone is required.");
    if (current.officePrivatePhone.trim() && !hasExactDigits(current.officePrivatePhone, 10)) {
      nextErrors.officePrivatePhone = "Office private phone must be a valid 10-digit number.";
    }
    addRequired("officeEmailAddress", "Office email address is required.");
    if (current.officeEmailAddress.trim() && !validateEmail(current.officeEmailAddress)) {
      nextErrors.officeEmailAddress = "Enter a valid email address.";
    }
    addRequired("afterHoursPhone", "After hours phone is required.");
    if (current.afterHoursPhone.trim() && !hasExactDigits(current.afterHoursPhone, 10)) {
      nextErrors.afterHoursPhone = "After hours phone must be a valid 10-digit number.";
    }
    addRequired("afterHoursDescription", "After hours description is required.");
    addRequired("afterHoursBeeper", "After hours beeper is required.");
    addRequired("afterHoursCellPhone", "After hours cell phone is required.");
    if (current.afterHoursCellPhone.trim() && !hasExactDigits(current.afterHoursCellPhone, 10)) {
      nextErrors.afterHoursCellPhone = "After hours cell phone must be a valid 10-digit number.";
    }
    addRequired("afterHoursHomePhone", "After hours home phone is required.");
    if (current.afterHoursHomePhone.trim() && !hasExactDigits(current.afterHoursHomePhone, 10)) {
      nextErrors.afterHoursHomePhone = "After hours home phone must be a valid 10-digit number.";
    }
    addRequired("backupPhysicianNumber", "Backup physician number is required.");
    addRequired("backupName", "Backup name is required.");
    addRequired("backupPhone", "Backup phone is required.");
    if (current.backupPhone.trim() && !hasExactDigits(current.backupPhone, 10)) {
      nextErrors.backupPhone = "Backup phone must be a valid 10-digit number.";
    }
    addRequired("hospitalAffiliation", "Hospital affiliation is required.");
    addRequired("hospitalPhone", "Hospital phone is required.");
    if (current.hospitalPhone.trim() && !hasExactDigits(current.hospitalPhone, 10)) {
      nextErrors.hospitalPhone = "Hospital phone must be a valid 10-digit number.";
    }
    addRequired("otherAffiliation", "Other affiliation is required.");
    addRequired("otherPhone", "Other phone is required.");
    if (current.otherPhone.trim() && !hasExactDigits(current.otherPhone, 10)) {
      nextErrors.otherPhone = "Other phone must be a valid 10-digit number.";
    }
    addRequired("specialHandling", "Special handling is required.");

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

    const payload: ClinicPhysicianChangeInformationRequest = {
      formType: FIXED_FORM_TYPE,
      name: formState.name.trim(),
      mohBillingNumber: digitsOnly(formState.mohBillingNumber),
      address: formState.address.trim(),
      specialty: formState.specialty.trim(),
      officeContactName: formState.officeContactName.trim(),
      officePhone: digitsOnly(formState.officePhone),
      officeFax: digitsOnly(formState.officeFax),
      officePrivatePhone: digitsOnly(formState.officePrivatePhone),
      officeEmailAddress: formState.officeEmailAddress.trim(),
      officeHours: formState.officeHours,
      afterHoursPhone: digitsOnly(formState.afterHoursPhone),
      afterHoursDescription: formState.afterHoursDescription.trim(),
      afterHoursBeeper: digitsOnly(formState.afterHoursBeeper),
      afterHoursCellPhone: digitsOnly(formState.afterHoursCellPhone),
      afterHoursHomePhone: digitsOnly(formState.afterHoursHomePhone),
      backupPhysicianNumber: digitsOnly(formState.backupPhysicianNumber),
      backupName: formState.backupName.trim(),
      backupPhone: digitsOnly(formState.backupPhone),
      hospitalAffiliation: formState.hospitalAffiliation.trim(),
      hospitalPhone: digitsOnly(formState.hospitalPhone),
      otherAffiliation: formState.otherAffiliation.trim(),
      otherPhone: digitsOnly(formState.otherPhone),
      specialHandling: formState.specialHandling.trim(),
    };

    setSaving(true);
    setError("");

    try {
      const response = await submitClinicPhysicianChangeInformationForm(
        session.accessToken,
        payload,
      );
      const missingFields = response.missing_fields ?? [];

      setAssets({
        savedAt: response.saved_at,
        missingFields,
      });

      if (missingFields.length > 0) {
        setError(formatResponseError("The backend returned the form with missing fields.", missingFields.map(humanizeKey)));
        return;
      }

      setFormState(parseResponseState(response));
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit the Physician Change Information form.",
      );
    } finally {
      setSaving(false);
    }
  }

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
                  <DialogField label="Name" required error={fieldErrors.name}>
                    <Input
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          name: normalizeNameInput(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="MOH billing number" required error={fieldErrors.mohBillingNumber}>
                    <Input
                      value={formState.mohBillingNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          mohBillingNumber: digitsOnly(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField className="md:col-span-2" label="Address" required error={fieldErrors.address}>
                    <Input
                      value={formState.address}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          address: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Specialty" required error={fieldErrors.specialty}>
                    <Input
                      value={formState.specialty}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          specialty: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="Office contact name"
                    required
                    error={fieldErrors.officeContactName}
                  >
                    <Input
                      value={formState.officeContactName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          officeContactName: normalizeNameInput(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Office phone" required error={fieldErrors.officePhone}>
                    <Input
                      value={formState.officePhone}
                      onChange={(event) =>
                        updatePhoneField("officePhone", digitsOnly(event.target.value), "Office phone")
                      }
                    />
                  </DialogField>
                  <DialogField label="Office fax" required error={fieldErrors.officeFax}>
                    <Input
                      value={formState.officeFax}
                      onChange={(event) =>
                        updatePhoneField(
                          "officeFax",
                          digitsOnly(event.target.value),
                          "Office fax",
                          "fax number",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="Office private phone"
                    required
                    error={fieldErrors.officePrivatePhone}
                  >
                    <Input
                      value={formState.officePrivatePhone}
                      onChange={(event) =>
                        updatePhoneField(
                          "officePrivatePhone",
                          digitsOnly(event.target.value),
                          "Office private phone",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField
                    className="md:col-span-2"
                    label="Office email address"
                    required
                    error={fieldErrors.officeEmailAddress}
                  >
                    <Input
                      type="email"
                      value={formState.officeEmailAddress}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          officeEmailAddress: event.target.value.trim(),
                        }))
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
                    <p className="text-sm font-semibold text-foreground">Office hours</p>
                    <p className="text-xs text-muted-foreground">Set the weekly schedule for the office.</p>
                  </div>
                </div>
                <OfficeHoursGrid
                  value={formState.officeHours}
                  onChange={(next) =>
                    setFormState((current) => ({
                      ...current,
                      officeHours: next,
                    }))
                  }
                />
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField
                    label="After hours phone"
                    required
                    error={fieldErrors.afterHoursPhone}
                  >
                    <Input
                      value={formState.afterHoursPhone}
                      onChange={(event) =>
                        updatePhoneField(
                          "afterHoursPhone",
                          digitsOnly(event.target.value),
                          "After hours phone",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="After hours description"
                    required
                    error={fieldErrors.afterHoursDescription}
                  >
                    <Input
                      value={formState.afterHoursDescription}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          afterHoursDescription: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="After hours beeper"
                    required
                    error={fieldErrors.afterHoursBeeper}
                  >
                    <Input
                      value={formState.afterHoursBeeper}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          afterHoursBeeper: digitsOnly(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="After hours cell phone"
                    required
                    error={fieldErrors.afterHoursCellPhone}
                  >
                    <Input
                      value={formState.afterHoursCellPhone}
                      onChange={(event) =>
                        updatePhoneField(
                          "afterHoursCellPhone",
                          digitsOnly(event.target.value),
                          "After hours cell phone",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="After hours home phone"
                    required
                    error={fieldErrors.afterHoursHomePhone}
                  >
                    <Input
                      value={formState.afterHoursHomePhone}
                      onChange={(event) =>
                        updatePhoneField(
                          "afterHoursHomePhone",
                          digitsOnly(event.target.value),
                          "After hours home phone",
                        )
                      }
                    />
                  </DialogField>
                  <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                    <DialogField
                      label="Backup physician number"
                      required
                      error={fieldErrors.backupPhysicianNumber}
                    >
                      <Input
                        value={formState.backupPhysicianNumber}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            backupPhysicianNumber: digitsOnly(event.target.value),
                          }))
                        }
                      />
                    </DialogField>
                    <DialogField label="Backup name" required error={fieldErrors.backupName}>
                      <Input
                      value={formState.backupName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          backupName: normalizeNameInput(event.target.value),
                        }))
                      }
                    />
                    </DialogField>
                    <DialogField label="Backup phone" required error={fieldErrors.backupPhone}>
                    <Input
                      value={formState.backupPhone}
                      onChange={(event) =>
                        updatePhoneField("backupPhone", digitsOnly(event.target.value), "Backup phone")
                      }
                    />
                    </DialogField>
                    <DialogField
                      label="Hospital affiliation"
                      required
                      error={fieldErrors.hospitalAffiliation}
                    >
                      <Input
                      value={formState.hospitalAffiliation}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          hospitalAffiliation: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                    </DialogField>
                    <DialogField label="Hospital phone" required error={fieldErrors.hospitalPhone}>
                    <Input
                      value={formState.hospitalPhone}
                      onChange={(event) =>
                        updatePhoneField("hospitalPhone", digitsOnly(event.target.value), "Hospital phone")
                      }
                    />
                    </DialogField>
                    <DialogField
                      label="Other affiliation"
                      required
                      error={fieldErrors.otherAffiliation}
                    >
                      <Input
                      value={formState.otherAffiliation}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          otherAffiliation: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                    />
                    </DialogField>
                    <DialogField label="Other phone" required error={fieldErrors.otherPhone}>
                    <Input
                      value={formState.otherPhone}
                      onChange={(event) =>
                        updatePhoneField("otherPhone", digitsOnly(event.target.value), "Other phone")
                      }
                    />
                    </DialogField>
                  </div>
                </div>

                <div className="mt-4">
                  <DialogField
                    label="Special handling"
                    required
                    error={fieldErrors.specialHandling}
                  >
                    <textarea
                      rows={4}
                      value={formState.specialHandling}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          specialHandling: capitalizeLeadingLetter(event.target.value),
                        }))
                      }
                      className="min-h-[120px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </DialogField>
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
                  ) : mode === "apply" ? (
                    "Apply application"
                  ) : (
                    "Update application"
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

export function PhysicianChangeInformationSection({
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

      <PhysicianChangeDialog
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
