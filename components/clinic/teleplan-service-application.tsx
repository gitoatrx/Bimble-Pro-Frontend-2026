"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, FileText, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchClinicTeleplan2820Form,
  submitClinicTeleplan2820Form,
  type ClinicTeleplan2820FacilityType,
  type ClinicTeleplan2820Mode,
  type ClinicTeleplan2820Request,
  type ClinicTeleplan2820Response,
} from "@/lib/api/clinic-dashboard";
import { readClinicLoginSession } from "@/lib/clinic/session";
import {
  capitalizeLeadingLetter,
  SignaturePad,
  digitsOnly,
  normalizeCityInput,
  normalizeNameInput,
  normalizePostalCode,
} from "@/components/doctor/doctor-form-shared";
import {
  hasExactDigits,
  updateLiveFutureDateField,
  updateLiveTenDigitField,
} from "@/lib/form-validation";

const FORM_TITLE = "Application for Teleplan Service";
const TELEPLAN_SIGNATURE_CACHE_KEY = "bimble.clinic.teleplan2820.signature_data_url";

function readTeleplanSignatureCache() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.localStorage.getItem(TELEPLAN_SIGNATURE_CACHE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeTeleplanSignatureCache(value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value.trim()) {
      window.localStorage.setItem(TELEPLAN_SIGNATURE_CACHE_KEY, value);
    } else {
      window.localStorage.removeItem(TELEPLAN_SIGNATURE_CACHE_KEY);
    }
  } catch {
    // Ignore storage failures.
  }
}

type Teleplan2820FormState = {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phoneNumber: string;
  organizationName: string;
  contactPerson: string;
  facilityType: ClinicTeleplan2820FacilityType;
  teleplanMode: ClinicTeleplan2820Mode;
  newDataCentreName: string;
  newDataCentreContact: string;
  existingDataCentreName: string;
  existingDataCentreNumber: string;
  serviceBureauName: string;
  serviceBureauNumber: string;
  computerMakeModel: string;
  computerMakeModel2: string;
  modemMakeModel: string;
  modemType: string;
  modemSpeed: string;
  softwareName: string;
  vendorName: string;
  supplier: string;
  mspPayeeNumber: string;
  signatureDate: string;
  signatureLabel: string;
  signatureDataUrl: string;
};

type Teleplan2820Assets = {
  savedAt: string;
  missingFields: string[];
};

type Teleplan2820FieldErrors = Partial<Record<keyof Teleplan2820FormState, string>>;
type TeleplanDialogMode = "apply" | "update";

function localIsoDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
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

function createEmptyState(): Teleplan2820FormState {
  const today = localIsoDate();

  return {
    name: "",
    address: "",
    city: "",
    postalCode: "",
    phoneNumber: "",
    organizationName: "",
    contactPerson: "",
    facilityType: "CLINIC",
    teleplanMode: "NEW_DATA_CENTRE",
    newDataCentreName: "",
    newDataCentreContact: "",
    existingDataCentreName: "",
    existingDataCentreNumber: "",
    serviceBureauName: "",
    serviceBureauNumber: "",
    computerMakeModel: "",
    computerMakeModel2: "",
    modemMakeModel: "",
    modemType: "",
    modemSpeed: "",
    softwareName: "",
    vendorName: "",
    supplier: "",
    mspPayeeNumber: "",
    signatureDate: today,
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

function parseSignature(source: Record<string, unknown>, response: ClinicTeleplan2820Response) {
  const nestedSignature = isRecord(source.signature) ? source.signature : null;
  const fallbackSignature = isRecord(response.saved_values.signature)
    ? (response.saved_values.signature as Record<string, unknown>)
    : null;

  return {
    signatureDataUrl:
      asString(source.signatureDataUrl) ||
      asString(source.signature_data_url) ||
      asString(nestedSignature?.signatureDataUrl) ||
      asString(nestedSignature?.signature_data_url) ||
      asString(response.signature_data_url) ||
      asString(fallbackSignature?.signatureDataUrl) ||
      asString(fallbackSignature?.signature_data_url),
    signatureLabel:
      asString(source.signatureLabel) ||
      asString(source.signature_label) ||
      asString(nestedSignature?.signatureLabel) ||
      asString(nestedSignature?.signature_label) ||
      asString(response.signature_label) ||
      asString(fallbackSignature?.signatureLabel) ||
      asString(fallbackSignature?.signature_label),
  };
}

function parseResponseState(response: ClinicTeleplan2820Response) {
  const saved = response.saved_values ?? {};
  const fallback = response.field_values ?? {};
  const source = isRecord(saved) && Object.keys(saved).length > 0 ? saved : fallback;
  const signature = parseSignature(source, response);
  const current = createEmptyState();
  const signatureDateSource =
    asString(source.Signature_Date) ||
    asString(fallback.Signature_Date) ||
    response.signature_signed_at ||
    response.saved_at;

  return {
    ...current,
    name: pickString(source, fallback, "name", "Name"),
    address: pickString(source, fallback, "address", "Address"),
    city: pickString(source, fallback, "city", "City"),
    postalCode:
      normalizePostalCode(
        pickString(source, fallback, "postal_code", "Postal_Code"),
      ) || current.postalCode,
    phoneNumber:
      digitsOnly(pickString(source, fallback, "phone_number", "Phone_Number")) ||
      current.phoneNumber,
    organizationName: pickString(source, fallback, "organization_name", "Organization_Name"),
    contactPerson: pickString(source, fallback, "contact_person", "Contact_Person"),
    facilityType:
      (asString(source.facility_type) as ClinicTeleplan2820FacilityType) ||
      current.facilityType,
    teleplanMode:
      (asString(source.teleplan_mode) as ClinicTeleplan2820Mode) || current.teleplanMode,
    newDataCentreName: pickString(
      source,
      fallback,
      "new_data_centre_name",
      "New_Data_Centre_Name",
    ),
    newDataCentreContact: pickString(
      source,
      fallback,
      "new_data_centre_contact",
      "New_Data_Centre_Contact",
    ),
    existingDataCentreName: pickString(
      source,
      fallback,
      "existing_data_centre_name",
      "Existing_Data_Centre_Name",
    ),
    existingDataCentreNumber: pickString(
      source,
      fallback,
      "existing_data_centre_number",
      "Existing_Data_Centre_Number",
    ),
    serviceBureauName: pickString(
      source,
      fallback,
      "service_bureau_name",
      "Service_Bureau_Name",
    ),
    serviceBureauNumber: pickString(
      source,
      fallback,
      "service_bureau_number",
      "Service_Bureau_Number",
    ),
    computerMakeModel: pickString(
      source,
      fallback,
      "computer_make_model",
      "Computer_Make_Model",
    ),
    computerMakeModel2: pickString(
      source,
      fallback,
      "computer_make_model2",
      "Computer_Make_Model2",
    ),
    modemMakeModel: pickString(source, fallback, "modem_make_model", "Modem_Make_Model"),
    modemType: pickString(source, fallback, "modem_type", "Modem"),
    modemSpeed: pickString(source, fallback, "modem_speed", "Modem_Speed"),
    softwareName: pickString(source, fallback, "software_name", "Software_Name"),
    vendorName: pickString(source, fallback, "vendor_name", "Vender_Name"),
    supplier: pickString(source, fallback, "supplier", "Supplier"),
    mspPayeeNumber: pickString(source, fallback, "msp_payee_number", "MSP_Payee_Number"),
    signatureDate: toDateInput(signatureDateSource) || current.signatureDate,
    signatureLabel:
      signature.signatureLabel ||
      pickString(source, fallback, "contact_person", "Contact_Person", "name", "Name") ||
      current.signatureLabel,
    signatureDataUrl: signature.signatureDataUrl || current.signatureDataUrl,
  };
}

function displayErrorLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
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

function Teleplan2820Dialog({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: TeleplanDialogMode;
  onClose: () => void;
}) {
  const session = readClinicLoginSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assets, setAssets] = useState<Teleplan2820Assets>({
    savedAt: "",
    missingFields: [],
  });
  const [formState, setFormState] = useState<Teleplan2820FormState>(() =>
    createEmptyState(),
  );
  const [fieldErrors, setFieldErrors] = useState<Teleplan2820FieldErrors>({});
  const signatureDataUrlRef = React.useRef("");
  const signatureExportPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!open) return;

    if (!session?.accessToken) {
      setError("Please sign in to open the Teleplan form.");
      return;
    }

    let active = true;
    setError("");
    setFieldErrors({});

    if (mode === "apply") {
      setLoading(false);
      setAssets({
        savedAt: "",
        missingFields: [],
      });
      setFormState(createEmptyState());
      signatureDataUrlRef.current = "";
      writeTeleplanSignatureCache("");
      return () => {
        active = false;
      };
    }

    setLoading(true);

    fetchClinicTeleplan2820Form(session.accessToken)
      .then((response) => {
        if (!active) return;

        const nextState = parseResponseState(response);
        const cachedSignature = readTeleplanSignatureCache();
        if (!nextState.signatureDataUrl && cachedSignature) {
          nextState.signatureDataUrl = cachedSignature;
        }
        setAssets({
          savedAt: response.saved_at,
          missingFields: response.missing_fields ?? [],
        });
        setFormState(nextState);
        signatureDataUrlRef.current = nextState.signatureDataUrl;
        if (nextState.signatureDataUrl) {
          writeTeleplanSignatureCache(nextState.signatureDataUrl);
        }
      })
      .catch((fetchError) => {
        if (!active) return;

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Could not load the Teleplan form.",
        );
        setAssets({
          savedAt: "",
          missingFields: [],
        });
        setFormState(createEmptyState());
        signatureDataUrlRef.current = "";
        writeTeleplanSignatureCache("");
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
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function validate(current: Teleplan2820FormState) {
    const nextErrors: Teleplan2820FieldErrors = {};
    const signatureValue = signatureDataUrlRef.current || current.signatureDataUrl;
    const addRequired = (field: keyof Teleplan2820FormState, message: string) => {
      if (!current[field]?.trim()) {
        nextErrors[field] = message;
      }
    };

    addRequired("name", "Name is required.");
    addRequired("address", "Address is required.");
    addRequired("city", "City is required.");
    addRequired("postalCode", "Postal code is required.");
    addRequired("phoneNumber", "Phone number is required.");
    if (current.phoneNumber.trim() && !hasExactDigits(current.phoneNumber, 10)) {
      nextErrors.phoneNumber = "Phone number must be a valid 10-digit number.";
    }
    addRequired("organizationName", "Organization name is required.");
    addRequired("contactPerson", "Contact person is required.");
    addRequired("facilityType", "Facility type is required.");
    addRequired("teleplanMode", "Teleplan mode is required.");
    addRequired("computerMakeModel", "Computer make/model is required.");
    addRequired("computerMakeModel2", "Computer make/model 2 is required.");
    addRequired("modemMakeModel", "Modem make/model is required.");
    addRequired("modemType", "Modem type is required.");
    addRequired("modemSpeed", "Modem speed is required.");
    addRequired("softwareName", "Software name is required.");
    addRequired("vendorName", "Vendor name is required.");
    addRequired("supplier", "Supplier is required.");
    addRequired("mspPayeeNumber", "MSP payee number is required.");
    addRequired("signatureDate", "Date signed is required.");
    addRequired("signatureLabel", "Signature label is required.");
    if (!signatureValue.trim()) {
      nextErrors.signatureDataUrl = "Signature is required.";
    }

    if (current.teleplanMode === "NEW_DATA_CENTRE") {
      addRequired("newDataCentreName", "New data centre name is required.");
      addRequired("newDataCentreContact", "New data centre contact is required.");
    }

    if (current.teleplanMode === "EXISTING_DATA_CENTRE") {
      addRequired("existingDataCentreName", "Existing data centre name is required.");
      addRequired("existingDataCentreNumber", "Existing data centre number is required.");
    }

    if (current.teleplanMode === "SERVICE_BUREAU") {
      addRequired("serviceBureauName", "Service bureau name is required.");
      addRequired("serviceBureauNumber", "Service bureau number is required.");
    }

    return nextErrors;
  }

  async function handleSubmit(actionMode: TeleplanDialogMode) {
    const actionVerb = actionMode === "apply" ? "applying" : "updating";

    if (!session?.accessToken) {
      setError("Please sign in to save the Teleplan form.");
      return;
    }

    if (signatureExportPromiseRef.current) {
      await signatureExportPromiseRef.current;
    }

    const signatureValue = signatureDataUrlRef.current || formState.signatureDataUrl;
    const submitState = {
      ...formState,
      signatureDataUrl: signatureValue,
    };
    const nextErrors = validate(submitState);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setError(`Please fill in the required fields before ${actionVerb}.`);
      return;
    }

    setSaving(true);
    setError("");

    const payload: ClinicTeleplan2820Request = {
      name: submitState.name.trim(),
      address: submitState.address.trim(),
      city: submitState.city.trim(),
      postal_code: normalizePostalCode(submitState.postalCode),
      phone_number: digitsOnly(submitState.phoneNumber),
      organization_name: submitState.organizationName.trim(),
      contact_person: submitState.contactPerson.trim(),
      facility_type: submitState.facilityType,
      teleplan_mode: submitState.teleplanMode,
      new_data_centre_name:
        submitState.teleplanMode === "NEW_DATA_CENTRE"
          ? submitState.newDataCentreName.trim()
          : null,
      new_data_centre_contact:
        submitState.teleplanMode === "NEW_DATA_CENTRE"
          ? submitState.newDataCentreContact.trim()
          : null,
      existing_data_centre_name:
        submitState.teleplanMode === "EXISTING_DATA_CENTRE"
          ? submitState.existingDataCentreName.trim()
          : null,
      existing_data_centre_number:
        submitState.teleplanMode === "EXISTING_DATA_CENTRE"
          ? submitState.existingDataCentreNumber.trim()
          : null,
      service_bureau_name:
        submitState.teleplanMode === "SERVICE_BUREAU"
          ? submitState.serviceBureauName.trim()
          : null,
      service_bureau_number:
        submitState.teleplanMode === "SERVICE_BUREAU"
          ? submitState.serviceBureauNumber.trim()
          : null,
      computer_make_model: submitState.computerMakeModel.trim(),
      computer_make_model2: submitState.computerMakeModel2.trim(),
      modem_make_model: submitState.modemMakeModel.trim(),
      modem_type: submitState.modemType.trim(),
      modem_speed: submitState.modemSpeed.trim(),
      software_name: submitState.softwareName.trim(),
      vendor_name: submitState.vendorName.trim(),
      supplier: submitState.supplier.trim(),
      msp_payee_number: digitsOnly(submitState.mspPayeeNumber),
      Signature_Date: submitState.signatureDate,
      signature: {
        signature_data_url: signatureValue,
        signature_label: submitState.signatureLabel.trim(),
      },
    };

    try {
      const response = await submitClinicTeleplan2820Form(session.accessToken, payload);
      const missingFields = response.missing_fields ?? [];

      setAssets({
        savedAt: response.saved_at,
        missingFields,
      });

      if (missingFields.length > 0) {
        setError(
          `The backend still reports missing fields: ${missingFields
            .map((field) => displayErrorLabel(field))
            .join(", ")}.`,
        );
        return;
      }

      const nextState = parseResponseState(response);
      setFormState(nextState);
      signatureDataUrlRef.current = nextState.signatureDataUrl;
      if (nextState.signatureDataUrl) {
        writeTeleplanSignatureCache(nextState.signatureDataUrl);
      }
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save the Teleplan form.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  const isNewDataCentre = formState.teleplanMode === "NEW_DATA_CENTRE";
  const isExistingDataCentre = formState.teleplanMode === "EXISTING_DATA_CENTRE";
  const isServiceBureau = formState.teleplanMode === "SERVICE_BUREAU";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
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
                Loading Teleplan form details...
              </div>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit(mode);
              }}
            >
              <section className="rounded-3xl border border-border p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField
                    label="Name"
                    required
                    error={fieldErrors.name}
                  >
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
                  <DialogField
                    label="Contact person"
                    required
                    error={fieldErrors.contactPerson}
                  >
                    <Input
                      value={formState.contactPerson}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          contactPerson: normalizeNameInput(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <DialogField label="Address" required error={fieldErrors.address}>
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
                  <DialogField label="City" required error={fieldErrors.city}>
                    <Input
                      value={formState.city}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          city: normalizeCityInput(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Postal code" required error={fieldErrors.postalCode}>
                    <Input
                      value={formState.postalCode}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          postalCode: normalizePostalCode(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Phone number" required error={fieldErrors.phoneNumber}>
                    <Input
                      value={formState.phoneNumber}
                      onChange={(event) =>
                        updateLiveTenDigitField(
                          setFormState,
                          setFieldErrors,
                          "phoneNumber",
                          event.target.value,
                          "Phone number",
                        )
                      }
                    />
                  </DialogField>
                  <DialogField label="MSP payee number" required error={fieldErrors.mspPayeeNumber}>
                    <Input
                      value={formState.mspPayeeNumber}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          mspPayeeNumber: digitsOnly(event.target.value),
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="Organization name"
                    required
                    error={fieldErrors.organizationName}
                  >
                    <Input
                      value={formState.organizationName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          organizationName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Facility type" required error={fieldErrors.facilityType}>
                    <select
                      className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={formState.facilityType}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          facilityType: event.target.value as ClinicTeleplan2820FacilityType,
                        }))
                      }
                    >
                      <option value="CLINIC">Clinic</option>
                      <option value="HOSPITAL">Hospital</option>
                      <option value="PRACTITIONER">Practitioner</option>
                      <option value="SERVICE_BUREAU">Service bureau</option>
                      <option value="VENDOR">Vendor</option>
                    </select>
                  </DialogField>
                  <DialogField label="Teleplan code" required error={fieldErrors.teleplanMode}>
                    <select
                      className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={formState.teleplanMode}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          teleplanMode: event.target.value as ClinicTeleplan2820Mode,
                        }))
                      }
                    >
                      <option value="NEW_DATA_CENTRE">New data centre</option>
                      <option value="EXISTING_DATA_CENTRE">Existing data centre</option>
                      <option value="SERVICE_BUREAU">Service bureau</option>
                    </select>
                  </DialogField>
                </div>
              </section>

              <section className="rounded-3xl border border-border p-5">
                {isNewDataCentre ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <DialogField
                      label="New data centre name"
                      required
                      error={fieldErrors.newDataCentreName}
                      className="md:col-span-1"
                    >
                      <Input
                        value={formState.newDataCentreName}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            newDataCentreName: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                    <DialogField
                      label="New data centre contact"
                      required
                      error={fieldErrors.newDataCentreContact}
                      className="md:col-span-1"
                    >
                      <Input
                        value={formState.newDataCentreContact}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            newDataCentreContact: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                  </div>
                ) : null}

                {isExistingDataCentre ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <DialogField
                      label="Existing data centre name"
                      required
                      error={fieldErrors.existingDataCentreName}
                    >
                      <Input
                        value={formState.existingDataCentreName}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            existingDataCentreName: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                    <DialogField
                      label="Existing data centre number"
                      required
                      error={fieldErrors.existingDataCentreNumber}
                    >
                      <Input
                        value={formState.existingDataCentreNumber}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            existingDataCentreNumber: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                  </div>
                ) : null}

                {isServiceBureau ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <DialogField
                      label="Service bureau name"
                      required
                      error={fieldErrors.serviceBureauName}
                    >
                      <Input
                        value={formState.serviceBureauName}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            serviceBureauName: event.target.value,
                          }))
                        }
                      />
                    </DialogField>
                    <DialogField
                      label="Service bureau number"
                      required
                      error={fieldErrors.serviceBureauNumber}
                    >
                      <Input
                        value={formState.serviceBureauNumber}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            serviceBureauNumber: event.target.value,
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
                    label="Computer make/model"
                    required
                    error={fieldErrors.computerMakeModel}
                  >
                    <Input
                      value={formState.computerMakeModel}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          computerMakeModel: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="Computer make/model 2"
                    required
                    error={fieldErrors.computerMakeModel2}
                  >
                    <Input
                      value={formState.computerMakeModel2}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          computerMakeModel2: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField
                    label="Modem make/model"
                    required
                    error={fieldErrors.modemMakeModel}
                  >
                    <Input
                      value={formState.modemMakeModel}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          modemMakeModel: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Modem type" required error={fieldErrors.modemType}>
                    <Input
                      value={formState.modemType}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          modemType: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Modem speed" required error={fieldErrors.modemSpeed}>
                    <Input
                      value={formState.modemSpeed}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          modemSpeed: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Software name" required error={fieldErrors.softwareName}>
                    <Input
                      value={formState.softwareName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          softwareName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Vendor name" required error={fieldErrors.vendorName}>
                    <Input
                      value={formState.vendorName}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          vendorName: event.target.value,
                        }))
                      }
                    />
                  </DialogField>
                  <DialogField label="Supplier" required error={fieldErrors.supplier}>
                    <Input
                      value={formState.supplier}
                      onChange={(event) =>
                        setFormState((current) => ({ ...current, supplier: event.target.value }))
                      }
                    />
                  </DialogField>
                </div>
              </section>

              <section className="rounded-3xl border border-border p-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <DialogField label="Date signed" required error={fieldErrors.signatureDate}>
                    <Input
                      type="date"
                      value={formState.signatureDate}
                      onChange={(event) =>
                        updateLiveFutureDateField(
                          setFormState,
                          setFieldErrors,
                          "signatureDate",
                          event.target.value,
                          "Date signed",
                        )
                      }
                    />
                  </DialogField>
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
                </div>

                <div className="mt-4 space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Signature
                    <span className="ml-1 text-destructive">*</span>
                  </span>
                  <SignaturePad
                    value={formState.signatureDataUrl}
                    onExportPromiseChange={(promise) => {
                      signatureExportPromiseRef.current = promise;
                    }}
                    onChange={(value) => {
                      signatureDataUrlRef.current = value;
                      setFormState((current) => ({ ...current, signatureDataUrl: value }));
                      setFieldErrors((current) => ({ ...current, signatureDataUrl: "" }));
                      setError("");
                      writeTeleplanSignatureCache(value);
                    }}
                  />
                  {fieldErrors.signatureDataUrl ? (
                    <p className="text-xs text-destructive">{fieldErrors.signatureDataUrl}</p>
                  ) : null}
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
                    {assets.missingFields.map(displayErrorLabel).join(", ")}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    void handleSubmit("apply");
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Apply HLTH 2820"
                  )}
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  className="gap-2"
                  onClick={() => {
                    void handleSubmit("update");
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Update HLTH 2820"
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

export function TeleplanServiceApplicationSection({
  autoOpen = false,
  onRequestClose,
}: {
  autoOpen?: boolean;
  onRequestClose?: () => void;
}) {
  const session = readClinicLoginSession();
  const [open, setOpen] = useState(autoOpen);
  const [mode, setMode] = useState<TeleplanDialogMode>(autoOpen ? "update" : "apply");

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
                variant="outline"
                onClick={() => {
                  setMode("update");
                  setOpen(true);
                }}
                disabled={!session?.accessToken}
                size="sm"
                className="gap-2 px-4"
              >
                Update
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setMode("apply");
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

      <Teleplan2820Dialog
        open={open}
        mode={mode}
        onClose={() => {
          setOpen(false);
          onRequestClose?.();
        }}
      />
    </>
  );
}
