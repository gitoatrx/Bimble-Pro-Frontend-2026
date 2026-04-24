"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldErrorState,
  SignaturePad,
  digitsOnly,
} from "@/components/doctor/doctor-form-shared";
import {
  fetchDoctorDuplicatePrescriptionPadOrder,
  submitDoctorDuplicatePrescriptionPadOrder,
  type DoctorDuplicatePrescriptionPadOrderAddressDetailsOption,
  type DoctorDuplicatePrescriptionPadOrderDeliveryOption,
  type DoctorDuplicatePrescriptionPadOrderGetResponse,
  type DoctorDuplicatePrescriptionPadOrderRequest,
} from "@/lib/api/doctor-dashboard";
import { readDoctorLoginSession } from "@/lib/doctor/session";

type DuplicatePrescriptionPadOrderFormState = {
  surname: string;
  given_names: string;
  college_id_number: string;
  primary_address: string;
  primary_phone: string;
  address_details_option: DoctorDuplicatePrescriptionPadOrderAddressDetailsOption;
  alternate_address: string;
  alternate_phone: string;
  delivery_option: DoctorDuplicatePrescriptionPadOrderDeliveryOption;
  delivery_address: string;
  delivery_phone: string;
  order_quantity: string;
  signature_label: string;
};

const initialFormState: DuplicatePrescriptionPadOrderFormState = {
  surname: "",
  given_names: "",
  college_id_number: "",
  primary_address: "",
  primary_phone: "",
  address_details_option: "INCLUDE_PRIMARY",
  alternate_address: "",
  alternate_phone: "",
  delivery_option: "PRIMARY_ADDRESS",
  delivery_address: "",
  delivery_phone: "",
  order_quantity: "",
  signature_label: "",
};

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

function parseSignature(
  source: Record<string, unknown>,
  response: DoctorDuplicatePrescriptionPadOrderGetResponse,
) {
  const nestedSignature = isRecord(source.signature) ? source.signature : null;
  const fallbackSignature = isRecord(response.saved_values.signature)
    ? (response.saved_values.signature as Record<string, unknown>)
    : null;

  return {
    signatureLabel:
      asString(source.signature_label) ||
      asString(source.signatureLabel) ||
      asString(nestedSignature?.signature_label) ||
      asString(nestedSignature?.signatureLabel) ||
      asString(response.signature_label) ||
      asString(fallbackSignature?.signature_label) ||
      asString(fallbackSignature?.signatureLabel),
    signatureDataUrl:
      asString(source.signature_data_url) ||
      asString(source.signatureDataUrl) ||
      asString(nestedSignature?.signature_data_url) ||
      asString(nestedSignature?.signatureDataUrl) ||
      asString(response.signature_data_url) ||
      asString(fallbackSignature?.signature_data_url) ||
      asString(fallbackSignature?.signatureDataUrl),
  };
}

function parseResponseState(response: DoctorDuplicatePrescriptionPadOrderGetResponse) {
  const saved = response.saved_values ?? {};
  const fallback = response.field_values ?? {};
  const source = isRecord(saved) && Object.keys(saved).length > 0 ? saved : fallback;
  const signature = parseSignature(source, response);

  return {
    ...initialFormState,
    surname: pickString(source, fallback, "surname", "Surname"),
    given_names: pickString(source, fallback, "given_names", "Given_Names", "GivenNames"),
    college_id_number: pickString(source, fallback, "college_id_number", "College_ID_Number"),
    primary_address: pickString(source, fallback, "primary_address", "Primary_Address", "Address"),
    primary_phone: digitsOnly(pickString(source, fallback, "primary_phone", "Primary_Phone")),
    address_details_option:
      (asString(source.address_details_option) as DoctorDuplicatePrescriptionPadOrderAddressDetailsOption) ||
      initialFormState.address_details_option,
    alternate_address: pickString(
      source,
      fallback,
      "alternate_address",
      "Alternate_Address",
    ),
    alternate_phone: digitsOnly(pickString(source, fallback, "alternate_phone", "Alternate_Phone")),
    delivery_option:
      (asString(source.delivery_option) as DoctorDuplicatePrescriptionPadOrderDeliveryOption) ||
      initialFormState.delivery_option,
    delivery_address: pickString(source, fallback, "delivery_address", "Delivery_Address"),
    delivery_phone: digitsOnly(pickString(source, fallback, "delivery_phone", "Delivery_Phone")),
    order_quantity: digitsOnly(pickString(source, fallback, "order_quantity", "Order_Quantity")),
    signature_label:
      signature.signatureLabel ||
      pickString(source, fallback, "signature_label", "Signature_Label", "contact_person", "Contact_Person", "name", "Name"),
  };
}

function displayBackendFieldLabel(value: string) {
  const directMap: Record<string, string> = {
    "form1[0].Physicianinformation[0].Address[0].#subform[0].#subform[1].Address2[0]":
      "Alternate address",
    "form1[0].Physicianinformation[0].Address[0].#subform[0].#subform[1].Phone2[0]":
      "Alternate phone",
    "form1[0].Physicianinformation[0].Deliver[0].#subform[0].#subform[1].Address3[0]":
      "Delivery address",
    "form1[0].Physicianinformation[0].Deliver[0].#subform[0].#subform[1].Phone3[0]":
      "Delivery phone",
  };

  if (directMap[value]) {
    return directMap[value];
  }

  return value
    .replace(/[_]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function FieldBlock({
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
    <label className={className ? `block space-y-2 ${className}` : "block space-y-2"}>
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </label>
  );
}

export function DoctorDuplicatePrescriptionPadOrderEditor({
  onSaved,
}: {
  onSaved?: () => void;
} = {}) {
  const [form, setForm] = useState(initialFormState);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrorState<keyof DuplicatePrescriptionPadOrderFormState | "signature">>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = readDoctorLoginSession();
      if (!session?.accessToken) {
        if (!cancelled) {
          setLoadError("You are not logged in.");
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetchDoctorDuplicatePrescriptionPadOrder(session.accessToken);
        if (cancelled) return;

        setForm(parseResponseState(response));
        setSignatureDataUrl(
          response.saved_values.signature?.signature_data_url ??
            response.signature_data_url ??
            "",
        );
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load duplicate prescription pad order.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function setField<K extends keyof DuplicatePrescriptionPadOrderFormState>(
    field: K,
    value: DuplicatePrescriptionPadOrderFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSaveError("");
    setSaved(false);
  }

  function validate(current: DuplicatePrescriptionPadOrderFormState, signature: string) {
    const nextErrors: FieldErrorState<keyof DuplicatePrescriptionPadOrderFormState | "signature"> = {};
    const addRequired = (field: keyof DuplicatePrescriptionPadOrderFormState, message: string) => {
      if (!current[field]?.trim()) {
        nextErrors[field] = message;
      }
    };

    addRequired("surname", "Surname is required.");
    addRequired("given_names", "Given names are required.");
    addRequired("college_id_number", "College ID number is required.");
    addRequired("primary_address", "Primary address is required.");
    addRequired("primary_phone", "Primary phone is required.");
    addRequired("address_details_option", "Address details option is required.");
    addRequired("alternate_address", "Alternate address is required.");
    addRequired("alternate_phone", "Alternate phone is required.");
    addRequired("delivery_option", "Delivery option is required.");
    addRequired("delivery_address", "Delivery address is required.");
    addRequired("delivery_phone", "Delivery phone is required.");
    addRequired("order_quantity", "Order quantity is required.");
    addRequired("signature_label", "Signature label is required.");

    if (!signature.trim()) {
      nextErrors.signature = "Signature is required.";
    }

    return nextErrors;
  }

  async function handleSubmit() {
    const nextErrors = validate(form, signatureDataUrl);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setSaveError("Your session is missing an access token. Please sign in again.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const payload: DoctorDuplicatePrescriptionPadOrderRequest = {
        surname: form.surname.trim(),
        given_names: form.given_names.trim(),
        college_id_number: digitsOnly(form.college_id_number),
        primary_address: form.primary_address.trim(),
        primary_phone: digitsOnly(form.primary_phone),
        address_details_option: form.address_details_option,
        alternate_address: form.alternate_address.trim(),
        alternate_phone: digitsOnly(form.alternate_phone),
        delivery_option: form.delivery_option,
        delivery_address: form.delivery_address.trim(),
        delivery_phone: digitsOnly(form.delivery_phone),
        order_quantity: digitsOnly(form.order_quantity),
        signature: {
          signature_data_url: signatureDataUrl,
          signature_label: form.signature_label.trim(),
        },
      };

      const response = await submitDoctorDuplicatePrescriptionPadOrder(session.accessToken, payload);
      if (response.missing_fields.length > 0) {
        setSaveError(
          `The backend still reports missing fields: ${response.missing_fields
            .map(displayBackendFieldLabel)
            .join(", ")}.`,
        );
        return;
      }

      setSaved(true);
      onSaved?.();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Could not save the duplicate prescription pad order.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading prescription pad order…</p>;
  }

  if (loadError) {
    return (
      <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <section className="rounded-3xl border border-border p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="Surname" required error={errors.surname}>
              <Input value={form.surname} onChange={(event) => setField("surname", event.target.value)} placeholder="Sharma" />
            </FieldBlock>
            <FieldBlock label="Given names" required error={errors.given_names}>
              <Input value={form.given_names} onChange={(event) => setField("given_names", event.target.value)} placeholder="Greg Sharma" />
            </FieldBlock>
            <FieldBlock label="College ID number" required error={errors.college_id_number}>
              <Input
                value={form.college_id_number}
                onChange={(event) => setField("college_id_number", digitsOnly(event.target.value))}
                placeholder="12345"
              />
            </FieldBlock>
            <FieldBlock label="Primary phone" required error={errors.primary_phone}>
              <Input
                type="tel"
                value={form.primary_phone}
                onChange={(event) => setField("primary_phone", digitsOnly(event.target.value))}
                placeholder="6045551212"
              />
            </FieldBlock>
            <FieldBlock label="Primary address" required error={errors.primary_address} className="md:col-span-2">
              <Input
                value={form.primary_address}
                onChange={(event) => setField("primary_address", event.target.value)}
                placeholder="123 Main Street, Mohali, BC V1V1V1"
              />
            </FieldBlock>
          </div>
        </section>

        <section className="rounded-3xl border border-border p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="Address details option" required error={errors.address_details_option} className="md:col-span-2">
              <select
                className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.address_details_option}
                onChange={(event) =>
                  setField(
                    "address_details_option",
                    event.target.value as DoctorDuplicatePrescriptionPadOrderAddressDetailsOption,
                  )
                }
              >
                <option value="INCLUDE_PRIMARY">Include primary address</option>
                <option value="INCLUDE_ALTERNATE">Include alternate address</option>
              </select>
            </FieldBlock>
            <FieldBlock label="Alternate address" required error={errors.alternate_address} className="md:col-span-2">
              <Input
                value={form.alternate_address}
                onChange={(event) => setField("alternate_address", event.target.value)}
                placeholder="456 Clinic Ave, Vancouver, BC V5H0A1"
              />
            </FieldBlock>
            <FieldBlock label="Alternate phone" required error={errors.alternate_phone}>
              <Input
                type="tel"
                value={form.alternate_phone}
                onChange={(event) => setField("alternate_phone", digitsOnly(event.target.value))}
                placeholder="6045553434"
              />
            </FieldBlock>
            <FieldBlock label="Order quantity" required error={errors.order_quantity}>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.order_quantity}
                onChange={(event) => setField("order_quantity", digitsOnly(event.target.value))}
                placeholder="2"
              />
            </FieldBlock>
            <FieldBlock label="Delivery option" required error={errors.delivery_option} className="md:col-span-2">
              <select
                className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.delivery_option}
                onChange={(event) =>
                  setField(
                    "delivery_option",
                    event.target.value as DoctorDuplicatePrescriptionPadOrderDeliveryOption,
                  )
                }
              >
                <option value="PRIMARY_ADDRESS">Primary address</option>
                <option value="ALTERNATE_ADDRESS">Alternate address</option>
              </select>
            </FieldBlock>
            <FieldBlock label="Delivery address" required error={errors.delivery_address} className="md:col-span-2">
              <Input
                value={form.delivery_address}
                onChange={(event) => setField("delivery_address", event.target.value)}
                placeholder="456 Clinic Ave, Vancouver, BC V5H0A1"
              />
            </FieldBlock>
            <FieldBlock label="Delivery phone" required error={errors.delivery_phone}>
              <Input
                type="tel"
                value={form.delivery_phone}
                onChange={(event) => setField("delivery_phone", digitsOnly(event.target.value))}
                placeholder="6045553434"
              />
            </FieldBlock>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldBlock label="Signature label" required error={errors.signature_label} className="md:col-span-2">
            <Input
              value={form.signature_label}
              onChange={(event) => setField("signature_label", event.target.value)}
              placeholder="Dr Greg Sharma"
            />
          </FieldBlock>
          <FieldBlock label="Signature" required error={errors.signature} className="md:col-span-2">
            <SignaturePad
              showHelperText={false}
              value={signatureDataUrl}
              onChange={(value) => {
                setSignatureDataUrl(value);
                setErrors((current) => ({ ...current, signature: "" }));
                setSaveError("");
                setSaved(false);
              }}
            />
          </FieldBlock>
        </div>

        {saveError ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </p>
        ) : null}

        {saved ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Duplicate prescription pad order saved successfully.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="h-12 flex-1" disabled={saving}>
            {saving ? "Saving..." : "Save prescription pad order"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
