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
  fetchDoctorHlth2820Onboarding,
  submitDoctorHlth2820Onboarding,
  type DoctorHlth2820GetResponse,
  type DoctorHlth2820Request,
} from "@/lib/api/doctor-onboarding";
import { readDoctorLoginSession } from "@/lib/doctor/session";

type DoctorHlth2820FormState = {
  name: string;
  address: string;
  city: string;
  postal_code: string;
  phone_number: string;
  organization_name: string;
  contact_person: string;
  msp_payee_number: string;
  facility_type: DoctorHlth2820Request["facility_type"];
  teleplan_mode: DoctorHlth2820Request["teleplan_mode"];
  new_data_centre_name: string;
  new_data_centre_contact: string;
  existing_data_centre_name: string;
  existing_data_centre_number: string;
  service_bureau_name: string;
  service_bureau_number: string;
  computer_make_model: string;
  computer_make_model2: string;
  modem_make_model: string;
  modem: string;
  modem_type: string;
  modem_speed: string;
  software_name: string;
  vendor_name: string;
  supplier: string;
  signature_label: string;
};

const initialFormState: DoctorHlth2820FormState = {
  name: "",
  address: "",
  city: "",
  postal_code: "",
  phone_number: "",
  organization_name: "",
  contact_person: "",
  msp_payee_number: "",
  facility_type: "CLINIC",
  teleplan_mode: "NEW_DATA_CENTRE",
  new_data_centre_name: "",
  new_data_centre_contact: "",
  existing_data_centre_name: "",
  existing_data_centre_number: "",
  service_bureau_name: "",
  service_bureau_number: "",
  computer_make_model: "",
  computer_make_model2: "",
  modem_make_model: "",
  modem: "",
  modem_type: "",
  modem_speed: "",
  software_name: "",
  vendor_name: "",
  supplier: "",
  signature_label: "",
};

function validateForm(form: DoctorHlth2820FormState, signatureDataUrl: string) {
  const errors: FieldErrorState<keyof DoctorHlth2820FormState | "signature"> = {};
  if (!form.name.trim()) errors.name = "name is required.";
  if (!form.address.trim()) errors.address = "address is required.";
  if (!form.city.trim()) errors.city = "city is required.";
  if (!normalizePostalCode(form.postal_code)) errors.postal_code = "postal_code is required.";
  if (!form.phone_number.trim()) errors.phone_number = "phone_number is required.";
  if (!form.organization_name.trim()) errors.organization_name = "organization_name is required.";
  if (!form.contact_person.trim()) errors.contact_person = "contact_person is required.";
  if (!form.msp_payee_number.trim()) errors.msp_payee_number = "msp_payee_number is required.";
  if (!form.facility_type.trim()) errors.facility_type = "facility_type is required.";
  if (!form.teleplan_mode.trim()) errors.teleplan_mode = "teleplan_mode is required.";
  if (form.teleplan_mode === "NEW_DATA_CENTRE") {
    if (!form.new_data_centre_name.trim()) errors.new_data_centre_name = "new_data_centre_name is required.";
    if (!form.new_data_centre_contact.trim()) errors.new_data_centre_contact = "new_data_centre_contact is required.";
  }
  if (form.teleplan_mode === "EXISTING_DATA_CENTRE") {
    if (!form.existing_data_centre_name.trim()) errors.existing_data_centre_name = "existing_data_centre_name is required.";
    if (!form.existing_data_centre_number.trim()) errors.existing_data_centre_number = "existing_data_centre_number is required.";
  }
  if (form.teleplan_mode === "SERVICE_BUREAU") {
    if (!form.service_bureau_name.trim()) errors.service_bureau_name = "service_bureau_name is required.";
    if (!form.service_bureau_number.trim()) errors.service_bureau_number = "service_bureau_number is required.";
  }
  if (!form.computer_make_model.trim()) errors.computer_make_model = "computer_make_model is required.";
  if (!form.computer_make_model2.trim()) errors.computer_make_model2 = "computer_make_model2 is required.";
  if (!form.modem_make_model.trim()) errors.modem_make_model = "modem_make_model is required.";
  if (!form.modem.trim()) errors.modem = "modem is required.";
  if (!form.modem_type.trim()) errors.modem_type = "modem_type is required.";
  if (!form.modem_speed.trim()) errors.modem_speed = "modem_speed is required.";
  if (!form.software_name.trim()) errors.software_name = "software_name is required.";
  if (!form.vendor_name.trim()) errors.vendor_name = "vendor_name is required.";
  if (!form.supplier.trim()) errors.supplier = "supplier is required.";
  if (!form.signature_label.trim()) errors.signature_label = "signature.signature_label is required.";
  if (!signatureDataUrl.trim()) errors.signature = "signature.signature_data_url is required.";
  return errors;
}

export function DoctorHlth2820Editor() {
  const [form, setForm] = useState(initialFormState);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const [errors, setErrors] = useState<FieldErrorState<keyof DoctorHlth2820FormState | "signature">>({});
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
        const response: DoctorHlth2820GetResponse = await fetchDoctorHlth2820Onboarding(session.accessToken);
        if (cancelled) return;

        const savedValues = response.saved_values;
        setForm({
          name: savedValues.name ?? "",
          address: savedValues.address ?? "",
          city: savedValues.city ?? "",
          postal_code: savedValues.postal_code ?? "",
          phone_number: savedValues.phone_number ?? "",
          organization_name: savedValues.organization_name ?? "",
          contact_person: savedValues.contact_person ?? "",
          msp_payee_number: savedValues.msp_payee_number ?? String(response.field_values["MSP_Payee_Number"] ?? ""),
          facility_type: savedValues.facility_type ?? "CLINIC",
          teleplan_mode: savedValues.teleplan_mode ?? "NEW_DATA_CENTRE",
          new_data_centre_name: savedValues.new_data_centre_name ?? "",
          new_data_centre_contact: savedValues.new_data_centre_contact ?? "",
          existing_data_centre_name: savedValues.existing_data_centre_name ?? "",
          existing_data_centre_number: savedValues.existing_data_centre_number ?? "",
          service_bureau_name: savedValues.service_bureau_name ?? "",
          service_bureau_number: savedValues.service_bureau_number ?? "",
          computer_make_model: savedValues.computer_make_model ?? "",
          computer_make_model2: savedValues.computer_make_model2 ?? "",
          modem_make_model: savedValues.modem_make_model ?? "",
          modem: String(response.field_values["Modem"] ?? savedValues.modem_type ?? ""),
          modem_type: String(response.field_values["Modem"] ?? savedValues.modem_type ?? ""),
          modem_speed: savedValues.modem_speed ?? "",
          software_name: savedValues.software_name ?? "",
          vendor_name: savedValues.vendor_name ?? "",
          supplier: savedValues.supplier ?? "",
          signature_label: savedValues.signature.signature_label ?? response.signature_label ?? "",
        });
        setSignatureDataUrl(savedValues.signature.signature_data_url ?? response.signature_data_url ?? "");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load HLTH 2820.");
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

  function setField<K extends keyof DoctorHlth2820FormState>(field: K, value: DoctorHlth2820FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSaveError("");
    setSaved(false);
  }

  async function handleSubmit() {
    const nextErrors = validateForm(form, signatureDataUrl);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setSaveError("Your session is missing an access token. Please sign in again.");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const payload: DoctorHlth2820Request = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postal_code: normalizePostalCode(form.postal_code),
        phone_number: digitsOnly(form.phone_number),
        organization_name: form.organization_name.trim(),
        contact_person: form.contact_person.trim(),
        msp_payee_number: digitsOnly(form.msp_payee_number),
        facility_type: form.facility_type,
        teleplan_mode: form.teleplan_mode,
        new_data_centre_name: form.teleplan_mode === "NEW_DATA_CENTRE" ? form.new_data_centre_name.trim() : null,
        new_data_centre_contact: form.teleplan_mode === "NEW_DATA_CENTRE" ? form.new_data_centre_contact.trim() : null,
        existing_data_centre_name: form.teleplan_mode === "EXISTING_DATA_CENTRE" ? form.existing_data_centre_name.trim() : null,
        existing_data_centre_number: form.teleplan_mode === "EXISTING_DATA_CENTRE" ? form.existing_data_centre_number.trim() : null,
        service_bureau_name: form.teleplan_mode === "SERVICE_BUREAU" ? form.service_bureau_name.trim() : null,
        service_bureau_number: form.teleplan_mode === "SERVICE_BUREAU" ? form.service_bureau_number.trim() : null,
        computer_make_model: form.computer_make_model.trim(),
        computer_make_model2: form.computer_make_model2.trim(),
        modem_make_model: form.modem_make_model.trim(),
        modem: form.modem.trim(),
        modem_type: form.modem_type.trim() || form.modem.trim(),
        modem_speed: form.modem_speed.trim(),
        software_name: form.software_name.trim(),
        vendor_name: form.vendor_name.trim(),
        supplier: form.supplier.trim(),
        signature: {
          signature_data_url: signatureDataUrl,
          signature_label: form.signature_label.trim(),
        },
      };

      const response = await submitDoctorHlth2820Onboarding(session.accessToken, payload);
      if (response.missing_fields.length > 0) {
        setSaveError(`The backend still reports missing fields: ${response.missing_fields.join(", ")}.`);
        return;
      }

      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the HLTH 2820 form.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading HLTH 2820…</p>;
  if (loadError) return <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{loadError}</p>;

  const showNewDataCentre = form.teleplan_mode === "NEW_DATA_CENTRE";
  const showExistingDataCentre = form.teleplan_mode === "EXISTING_DATA_CENTRE";
  const showServiceBureau = form.teleplan_mode === "SERVICE_BUREAU";

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
            <FormLabel htmlFor="name">Name</FormLabel>
            <Input id="name" value={form.name} onChange={(event) => setField("name", event.target.value)} placeholder="Helly Clinton" />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="contact_person">Contact person</FormLabel>
            <Input id="contact_person" value={form.contact_person} onChange={(event) => setField("contact_person", event.target.value)} placeholder="Helly Clinton" />
            {errors.contact_person ? <p className="text-xs text-destructive">{errors.contact_person}</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <FormLabel htmlFor="address">Address</FormLabel>
            <Input id="address" value={form.address} onChange={(event) => setField("address", event.target.value)} placeholder="456 Clinic Ave" />
            {errors.address ? <p className="text-xs text-destructive">{errors.address}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="city">City</FormLabel>
            <Input id="city" value={form.city} onChange={(event) => setField("city", event.target.value)} placeholder="Burnaby" />
            {errors.city ? <p className="text-xs text-destructive">{errors.city}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="postal_code">Postal code</FormLabel>
            <Input id="postal_code" value={form.postal_code} onChange={(event) => setField("postal_code", normalizePostalCode(event.target.value))} placeholder="V5H0A1" />
            {errors.postal_code ? <p className="text-xs text-destructive">{errors.postal_code}</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <FormLabel htmlFor="phone_number">Phone number</FormLabel>
            <Input id="phone_number" type="tel" value={form.phone_number} onChange={(event) => setField("phone_number", digitsOnly(event.target.value))} placeholder="9078675645" />
            {errors.phone_number ? <p className="text-xs text-destructive">{errors.phone_number}</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <FormLabel htmlFor="organization_name">Organization name</FormLabel>
            <Input id="organization_name" value={form.organization_name} onChange={(event) => setField("organization_name", event.target.value)} placeholder="Sage Clinic" />
            {errors.organization_name ? <p className="text-xs text-destructive">{errors.organization_name}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="msp_payee_number">MSP payee number</FormLabel>
            <Input id="msp_payee_number" value={form.msp_payee_number} onChange={(event) => setField("msp_payee_number", digitsOnly(event.target.value))} placeholder="565588" />
            {errors.msp_payee_number ? <p className="text-xs text-destructive">{errors.msp_payee_number}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="facility_type">Facility type</FormLabel>
            <select
              id="facility_type"
              value={form.facility_type}
              onChange={(event) => setField("facility_type", event.target.value as DoctorHlth2820FormState["facility_type"])}
              className="flex h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="CLINIC">CLINIC</option>
              <option value="HOSPITAL">HOSPITAL</option>
              <option value="PRACTITIONER">PRACTITIONER</option>
              <option value="SERVICE_BUREAU">SERVICE_BUREAU</option>
              <option value="VENDOR">VENDOR</option>
            </select>
            {errors.facility_type ? <p className="text-xs text-destructive">{errors.facility_type}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="teleplan_mode">Teleplan mode</FormLabel>
            <select
              id="teleplan_mode"
              value={form.teleplan_mode}
              onChange={(event) => setField("teleplan_mode", event.target.value as DoctorHlth2820FormState["teleplan_mode"])}
              className="flex h-12 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            >
              <option value="NEW_DATA_CENTRE">NEW_DATA_CENTRE</option>
              <option value="EXISTING_DATA_CENTRE">EXISTING_DATA_CENTRE</option>
              <option value="SERVICE_BUREAU">SERVICE_BUREAU</option>
            </select>
            {errors.teleplan_mode ? <p className="text-xs text-destructive">{errors.teleplan_mode}</p> : null}
          </div>
          {showNewDataCentre ? (
            <>
              <div className="grid gap-2">
                <FormLabel htmlFor="new_data_centre_name">New data centre name</FormLabel>
                <Input id="new_data_centre_name" value={form.new_data_centre_name} onChange={(event) => setField("new_data_centre_name", event.target.value)} placeholder="Sage Teleplan Centre" />
                {errors.new_data_centre_name ? <p className="text-xs text-destructive">{errors.new_data_centre_name}</p> : null}
              </div>
              <div className="grid gap-2">
                <FormLabel htmlFor="new_data_centre_contact">New data centre contact</FormLabel>
                <Input id="new_data_centre_contact" value={form.new_data_centre_contact} onChange={(event) => setField("new_data_centre_contact", event.target.value)} placeholder="Helly Clinton" />
                {errors.new_data_centre_contact ? <p className="text-xs text-destructive">{errors.new_data_centre_contact}</p> : null}
              </div>
            </>
          ) : null}
          {showExistingDataCentre ? (
            <>
              <div className="grid gap-2">
                <FormLabel htmlFor="existing_data_centre_name">Existing data centre name</FormLabel>
                <Input id="existing_data_centre_name" value={form.existing_data_centre_name} onChange={(event) => setField("existing_data_centre_name", event.target.value)} />
                {errors.existing_data_centre_name ? <p className="text-xs text-destructive">{errors.existing_data_centre_name}</p> : null}
              </div>
              <div className="grid gap-2">
                <FormLabel htmlFor="existing_data_centre_number">Existing data centre number</FormLabel>
                <Input id="existing_data_centre_number" value={form.existing_data_centre_number} onChange={(event) => setField("existing_data_centre_number", event.target.value)} />
                {errors.existing_data_centre_number ? <p className="text-xs text-destructive">{errors.existing_data_centre_number}</p> : null}
              </div>
            </>
          ) : null}
          {showServiceBureau ? (
            <>
              <div className="grid gap-2">
                <FormLabel htmlFor="service_bureau_name">Service bureau name</FormLabel>
                <Input id="service_bureau_name" value={form.service_bureau_name} onChange={(event) => setField("service_bureau_name", event.target.value)} />
                {errors.service_bureau_name ? <p className="text-xs text-destructive">{errors.service_bureau_name}</p> : null}
              </div>
              <div className="grid gap-2">
                <FormLabel htmlFor="service_bureau_number">Service bureau number</FormLabel>
                <Input id="service_bureau_number" value={form.service_bureau_number} onChange={(event) => setField("service_bureau_number", event.target.value)} />
                {errors.service_bureau_number ? <p className="text-xs text-destructive">{errors.service_bureau_number}</p> : null}
              </div>
            </>
          ) : null}
          <div className="grid gap-2">
            <FormLabel htmlFor="computer_make_model">Computer make/model</FormLabel>
            <Input id="computer_make_model" value={form.computer_make_model} onChange={(event) => setField("computer_make_model", event.target.value)} placeholder="Dell OptiPlex 7090" />
            {errors.computer_make_model ? <p className="text-xs text-destructive">{errors.computer_make_model}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="computer_make_model2">Computer make/model 2</FormLabel>
            <Input id="computer_make_model2" value={form.computer_make_model2} onChange={(event) => setField("computer_make_model2", event.target.value)} placeholder="HP ProDesk 600" />
            {errors.computer_make_model2 ? <p className="text-xs text-destructive">{errors.computer_make_model2}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="modem_make_model">Modem make/model</FormLabel>
            <Input id="modem_make_model" value={form.modem_make_model} onChange={(event) => setField("modem_make_model", event.target.value)} placeholder="Netgear Nighthawk" />
            {errors.modem_make_model ? <p className="text-xs text-destructive">{errors.modem_make_model}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="modem_type">Modem</FormLabel>
            <Input
              id="modem_type"
              value={form.modem_type}
              onChange={(event) => {
                const value = event.target.value;
                setField("modem_type", value);
                setField("modem", value);
              }}
              placeholder="EXT"
            />
            {errors.modem ? <p className="text-xs text-destructive">{errors.modem}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="modem_speed">Modem speed</FormLabel>
            <Input id="modem_speed" value={form.modem_speed} onChange={(event) => setField("modem_speed", event.target.value)} placeholder="1 Gbps" />
            {errors.modem_speed ? <p className="text-xs text-destructive">{errors.modem_speed}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="software_name">Software name</FormLabel>
            <Input id="software_name" value={form.software_name} onChange={(event) => setField("software_name", event.target.value)} placeholder="Bimble Teleplan Bridge" />
            {errors.software_name ? <p className="text-xs text-destructive">{errors.software_name}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="vendor_name">Vendor name</FormLabel>
            <Input id="vendor_name" value={form.vendor_name} onChange={(event) => setField("vendor_name", event.target.value)} placeholder="Bimble" />
            {errors.vendor_name ? <p className="text-xs text-destructive">{errors.vendor_name}</p> : null}
          </div>
          <div className="grid gap-2">
            <FormLabel htmlFor="supplier">Supplier</FormLabel>
            <Input id="supplier" value={form.supplier} onChange={(event) => setField("supplier", event.target.value)} placeholder="Bimble" />
            {errors.supplier ? <p className="text-xs text-destructive">{errors.supplier}</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <FormLabel htmlFor="signature_label">Signature label</FormLabel>
            <Input id="signature_label" value={form.signature_label} onChange={(event) => setField("signature_label", event.target.value)} placeholder="Helly Clinton" />
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
            HLTH 2820 updated successfully.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" className="h-12 flex-1" disabled={saving}>
            {saving ? "Saving..." : "Save HLTH 2820"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}


