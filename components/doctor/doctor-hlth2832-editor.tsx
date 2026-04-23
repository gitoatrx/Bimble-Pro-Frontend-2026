"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldErrorState,
  FormLabel,
  SignaturePad,
  digitsOnly,
  normalizePostalCode,
} from "@/components/doctor/doctor-form-shared";
import {
  fetchDoctorHlth2832Onboarding,
  submitDoctorHlth2832Onboarding,
  type DoctorHlth2832GetResponse,
  type DoctorHlth2832Request,
} from "@/lib/api/doctor-onboarding";
import { readDoctorLoginSession } from "@/lib/doctor/session";

type DoctorHlth2832FormState = Omit<DoctorHlth2832Request, "signature"> & {
  signature_label: string;
};

const initialFormState: DoctorHlth2832FormState = {
  msp_billing_number: "",
  payment_number: "",
  payee_name: "",
  institution_number: "",
  branch_number: "",
  account_number: "",
  institution_bank_name: "",
  branch_name: "",
  street_address: "",
  city: "",
  province: "",
  postal_code: "",
  telephone: "",
  telephone2: "",
  signature_label: "",
};

function validateStep3(
  formState: DoctorHlth2832FormState,
  signatureDataUrl: string,
) {
  const errors: FieldErrorState<keyof DoctorHlth2832FormState | "signature"> = {};

  if (!formState.msp_billing_number.trim()) {
    errors.msp_billing_number = "msp_billing_number is required.";
  }
  if (!formState.payment_number.trim()) {
    errors.payment_number = "payment_number is required.";
  }
  if (!formState.payee_name.trim()) {
    errors.payee_name = "payee_name is required.";
  }
  if (!formState.institution_number.trim()) {
    errors.institution_number = "institution_number is required.";
  }
  if (!formState.branch_number.trim()) {
    errors.branch_number = "branch_number is required.";
  }
  if (!formState.account_number.trim()) {
    errors.account_number = "account_number is required.";
  }
  if (!formState.institution_bank_name.trim()) {
    errors.institution_bank_name = "institution_bank_name is required.";
  }
  if (!formState.branch_name.trim()) {
    errors.branch_name = "branch_name is required.";
  }
  if (!formState.street_address.trim()) {
    errors.street_address = "street_address is required.";
  }
  if (!formState.city.trim()) {
    errors.city = "city is required.";
  }
  if (!formState.province.trim()) {
    errors.province = "province is required.";
  }
  if (!normalizePostalCode(formState.postal_code)) {
    errors.postal_code = "postal_code is required.";
  }
  if (!digitsOnly(formState.telephone)) {
    errors.telephone = "telephone is required.";
  }
  if (!digitsOnly(formState.telephone2)) {
    errors.telephone2 = "telephone2 is required.";
  }
  if (!formState.signature_label.trim()) {
    errors.signature_label = "signature.signature_label is required.";
  }
  if (!signatureDataUrl.trim()) {
    errors.signature = "signature.signature_data_url is required.";
  }

  return errors;
}

export function DoctorHlth2832Editor() {
  const [form, setForm] = useState<DoctorHlth2832FormState>(initialFormState);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrorState<keyof DoctorHlth2832FormState | "signature">>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const signatureExportPromiseRef = useRef<Promise<void> | null>(null);

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
        const response: DoctorHlth2832GetResponse = await fetchDoctorHlth2832Onboarding(session.accessToken);
        if (cancelled) return;

        const savedValues = response.saved_values;
        setForm({
          msp_billing_number: savedValues.msp_billing_number ?? "",
          payment_number: savedValues.payment_number ?? "",
          payee_name: savedValues.payee_name ?? "",
          institution_number: savedValues.institution_number ?? "",
          branch_number: savedValues.branch_number ?? "",
          account_number: savedValues.account_number ?? "",
          institution_bank_name: savedValues.institution_bank_name ?? "",
          branch_name: savedValues.branch_name ?? "",
          street_address: savedValues.street_address ?? "",
          city: savedValues.city ?? "",
          province: savedValues.province ?? "",
          postal_code: savedValues.postal_code ?? "",
          telephone: savedValues.telephone ?? "",
          telephone2: savedValues.telephone2 ?? "",
          signature_label: savedValues.signature.signature_label ?? response.signature_label ?? "",
        });
        setSignatureDataUrl(savedValues.signature.signature_data_url ?? response.signature_data_url ?? "");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load HLTH 2832.");
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

  function setField<K extends keyof DoctorHlth2832FormState>(field: K, value: DoctorHlth2832FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSaveError("");
    setSaved(false);
  }

  async function handleSubmit() {
    const nextErrors = validateStep3(form, signatureDataUrl);
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
      const payload: DoctorHlth2832Request = {
        msp_billing_number: form.msp_billing_number.trim(),
        payment_number: form.payment_number.trim(),
        payee_name: form.payee_name.trim(),
        institution_number: form.institution_number.trim(),
        branch_number: form.branch_number.trim(),
        account_number: form.account_number.trim(),
        institution_bank_name: form.institution_bank_name.trim(),
        branch_name: form.branch_name.trim(),
        street_address: form.street_address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        postal_code: normalizePostalCode(form.postal_code),
        telephone: digitsOnly(form.telephone),
        telephone2: digitsOnly(form.telephone2),
        signature: {
          signature_data_url: signatureDataUrl,
          signature_label: form.signature_label.trim(),
        },
      };

      const response = await submitDoctorHlth2832Onboarding(session.accessToken, payload);
      if (response.missing_fields.length > 0) {
        setSaveError(
          `The backend still reports missing fields: ${response.missing_fields.join(", ")}.`,
        );
        return;
      }

      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the HLTH 2832 form.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading HLTH 2832…</p>;
  }

  if (loadError) {
    return <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{loadError}</p>;
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <FormLabel htmlFor="step3_msp_billing_number">MSP billing number</FormLabel>
            <Input
              id="step3_msp_billing_number"
              value={form.msp_billing_number}
              onChange={(event) => setField("msp_billing_number", digitsOnly(event.target.value))}
              placeholder="1234567"
            />
            {errors.msp_billing_number ? <p className="text-xs text-destructive">{errors.msp_billing_number}</p> : null}
          </div>

          <div className="grid gap-2">
            <FormLabel htmlFor="payment_number">Payment number</FormLabel>
            <Input
              id="payment_number"
              value={form.payment_number}
              onChange={(event) => setField("payment_number", digitsOnly(event.target.value))}
              placeholder="1234567"
            />
            {errors.payment_number ? <p className="text-xs text-destructive">{errors.payment_number}</p> : null}
          </div>

          <div className="grid gap-2">
            <FormLabel htmlFor="payee_name">Payee name</FormLabel>
            <Input
              id="payee_name"
              value={form.payee_name}
              onChange={(event) => setField("payee_name", event.target.value)}
              placeholder="Mat Mardock"
            />
            {errors.payee_name ? <p className="text-xs text-destructive">{errors.payee_name}</p> : null}
          </div>

          <div className="grid gap-2">
            <FormLabel htmlFor="institution_number">Institution number</FormLabel>
            <Input
              id="institution_number"
              value={form.institution_number}
              onChange={(event) => setField("institution_number", event.target.value)}
              placeholder="001"
            />
            {errors.institution_number ? <p className="text-xs text-destructive">{errors.institution_number}</p> : null}
          </div>

          <div className="grid gap-2">
            <FormLabel htmlFor="branch_number">Branch number</FormLabel>
            <Input
              id="branch_number"
              value={form.branch_number}
              onChange={(event) => setField("branch_number", event.target.value)}
              placeholder="12345"
            />
            {errors.branch_number ? <p className="text-xs text-destructive">{errors.branch_number}</p> : null}
          </div>

          <div className="grid gap-2">
            <FormLabel htmlFor="account_number">Account number</FormLabel>
            <Input
              id="account_number"
              value={form.account_number}
              onChange={(event) => setField("account_number", event.target.value)}
              placeholder="000999888"
            />
            {errors.account_number ? <p className="text-xs text-destructive">{errors.account_number}</p> : null}
          </div>

          <div className="grid gap-2">
            <FormLabel htmlFor="institution_bank_name">Institution bank name</FormLabel>
            <Input
              id="institution_bank_name"
              value={form.institution_bank_name}
              onChange={(event) => setField("institution_bank_name", event.target.value)}
              placeholder="Royal Bank"
            />
            {errors.institution_bank_name ? <p className="text-xs text-destructive">{errors.institution_bank_name}</p> : null}
          </div>

          <div className="grid gap-2">
            <FormLabel htmlFor="branch_name">Branch name</FormLabel>
            <Input
              id="branch_name"
              value={form.branch_name}
              onChange={(event) => setField("branch_name", event.target.value)}
              placeholder="Metrotown"
            />
            {errors.branch_name ? <p className="text-xs text-destructive">{errors.branch_name}</p> : null}
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
            <div className="grid gap-2">
              <FormLabel htmlFor="street_address">Street address</FormLabel>
              <Input
                id="street_address"
                value={form.street_address}
                onChange={(event) => setField("street_address", event.target.value)}
                placeholder="123 Home Street"
              />
              {errors.street_address ? <p className="text-xs text-destructive">{errors.street_address}</p> : null}
            </div>

            <div className="grid gap-2">
              <FormLabel htmlFor="city">City</FormLabel>
              <Input
                id="city"
                value={form.city}
                onChange={(event) => setField("city", event.target.value)}
                placeholder="Burnaby"
              />
              {errors.city ? <p className="text-xs text-destructive">{errors.city}</p> : null}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
            <div className="grid gap-2">
              <FormLabel htmlFor="province">Province</FormLabel>
              <Input
                id="province"
                value={form.province}
                onChange={(event) => setField("province", event.target.value)}
                placeholder="BC"
              />
              {errors.province ? <p className="text-xs text-destructive">{errors.province}</p> : null}
            </div>

            <div className="grid gap-2">
              <FormLabel htmlFor="postal_code">Postal code</FormLabel>
              <Input
                id="postal_code"
                value={form.postal_code}
                onChange={(event) => setField("postal_code", normalizePostalCode(event.target.value))}
                placeholder="V5H0A1"
              />
              {errors.postal_code ? <p className="text-xs text-destructive">{errors.postal_code}</p> : null}
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:col-span-2">
            <div className="grid gap-2">
              <FormLabel htmlFor="telephone">Telephone</FormLabel>
              <Input
                id="telephone"
                type="tel"
                value={form.telephone}
                onChange={(event) => setField("telephone", digitsOnly(event.target.value))}
                placeholder="6041112222"
              />
              {errors.telephone ? <p className="text-xs text-destructive">{errors.telephone}</p> : null}
            </div>

            <div className="grid gap-2">
              <FormLabel htmlFor="telephone2">Telephone 2</FormLabel>
              <Input
                id="telephone2"
                type="tel"
                value={form.telephone2}
                onChange={(event) => setField("telephone2", digitsOnly(event.target.value))}
                placeholder="6041113333"
              />
              {errors.telephone2 ? <p className="text-xs text-destructive">{errors.telephone2}</p> : null}
            </div>
          </div>

          <div className="grid gap-2 md:col-span-2">
            <FormLabel htmlFor="step3_signature_label">Signature label</FormLabel>
            <Input
              id="step3_signature_label"
              value={form.signature_label}
              onChange={(event) => setField("signature_label", event.target.value)}
              placeholder="Dr Mat Mardock"
            />
            {errors.signature_label ? <p className="text-xs text-destructive">{errors.signature_label}</p> : null}
          </div>

          <div className="grid gap-2 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground">Signature</span>
            </div>
            <SignaturePad
              showHelperText={false}
              value={signatureDataUrl}
              onChange={(value) => {
                setSignatureDataUrl(value);
                setErrors((current) => ({ ...current, signature: "" }));
                setSaveError("");
                setSaved(false);
              }}
              onExportPromiseChange={(promise) => {
                signatureExportPromiseRef.current = promise;
              }}
            />
            {errors.signature ? <p className="text-xs text-destructive">{errors.signature}</p> : null}
          </div>
        </div>

        {saveError ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {saveError}
          </p>
        ) : null}

        {saved ? (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            HLTH 2832 updated successfully.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="h-12 flex-1" disabled={saving}>
            {saving ? "Saving..." : "Save HLTH 2832"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>

    </div>
  );
}

