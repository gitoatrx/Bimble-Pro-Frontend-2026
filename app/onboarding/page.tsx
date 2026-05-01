"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Upload } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { GooglePlacesAddressInput } from "@/components/clinic-access/google-places-address-input";
import { FieldError } from "@/components/clinic-access/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitClinicOnboarding } from "@/lib/api/clinic";
import {
  readClinicOnboardingState,
  readClinicSelectedPlan,
  storeClinicOnboardingState,
  storeClinicSignupResult,
} from "@/lib/clinic/session";
import {
  clinicTypeOptions,
  capitalizeWordsInput,
  formatPhoneNumber,
  formatPostalCode,
  initialClinicOnboardingFormData,
  normalizeCityNameInput,
  normalizeClinicOnboardingFormData,
  normalizeClinicTextInput,
  normalizeServicesInput,
  onboardingStepOrder,
  validateClinicOnboardingStep,
} from "@/lib/clinic/onboarding";
import type {
  ClinicAddressSelection,
  DemographicImportPayload,
  DemographicImportRow,
  ClinicOnboardingFormData,
  ClinicPlan,
  FieldErrors,
  OnboardingStepKey,
} from "@/lib/clinic/types";

const onboardingStepTitles: Record<OnboardingStepKey, string> = {
  clinic: "Set up your clinic",
  location: "Add clinic location",
  operations: "Add contact details",
  credentials: "Set your credentials",
  demographics: "Import demographics",
};

const onboardingStepHelpers: Record<OnboardingStepKey, string> = {
  clinic: "Enter the clinic identity details.",
  location: "Add the clinic address and postal code.",
  operations: "Finish with the contact and service details.",
  credentials: "Create your admin password and 4-digit PIN for Bimble and OSCAR.",
  demographics: "Choose whether to stage an OSCAR-compatible demographics import before payment.",
};

const neutralFieldClassName =
  "h-12 !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20";

const neutralTextareaClassName =
  "min-h-28 resize-none !border-slate-200 !bg-white !text-slate-900 !shadow-none focus-visible:ring-primary/20";

const neutralSelectClassName =
  "flex h-12 w-full rounded-md !border !border-slate-200 !bg-white px-3 py-2 text-sm text-slate-900 shadow-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/20";

const invalidFieldClassName =
  "!border-destructive/60 focus-visible:ring-destructive/20";

type ImportMode = "skip" | "import";

type ParsedDemographicImport = {
  rows: DemographicImportRow[];
  errors: string[];
};

type OscarImportPackage = {
  fileName: string;
  fileFormat: "xml" | "zip";
  fileBase64: string;
  fileSize: number;
};

const demographicImportHeaders = [
  "last_name",
  "first_name",
  "sex",
  "year_of_birth",
  "month_of_birth",
  "date_of_birth",
  "hin",
  "ver",
  "address",
  "city",
  "province",
  "postal",
  "phone",
  "phone2",
  "email",
  "provider_no",
  "roster_status",
  "patient_status",
];

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function normalizeSex(value: string) {
  const raw = value.trim().toUpperCase();
  if (raw === "MALE") return "M";
  if (raw === "FEMALE") return "F";
  if (raw === "OTHER") return "O";
  if (raw === "UNKNOWN") return "U";
  return raw.slice(0, 1);
}

function buildDemographicTemplate() {
  return `${demographicImportHeaders.join(",")}\nDoe,Jane,F,1988,04,22,9999999999,,123 Main St,Vancouver,BC,V6B 1A1,6045550100,6045550101,jane@example.com,,ROSTERED,AC`;
}

function parseDemographicCsv(csvText: string): ParsedDemographicImport {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], errors: ["Add a header row and at least one demographic row."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const errors: string[] = [];
  const rows: DemographicImportRow[] = [];

  for (const required of ["last_name", "first_name", "sex", "year_of_birth", "month_of_birth", "date_of_birth"]) {
    if (!headers.includes(required)) {
      errors.push(`Missing required OSCAR column: ${required}`);
    }
  }

  lines.slice(1).forEach((line, index) => {
    const values = parseCsvLine(line);
    const original: Record<string, string> = {};
    headers.forEach((header, valueIndex) => {
      original[header] = values[valueIndex]?.trim() ?? "";
    });

    const rowNumber = index + 2;
    const rowErrors: string[] = [];
    const required = ["last_name", "first_name", "sex", "year_of_birth", "month_of_birth", "date_of_birth"];
    for (const field of required) {
      if (!original[field]) rowErrors.push(`${field} is required`);
    }
    if (original.year_of_birth && !/^\d{4}$/.test(original.year_of_birth)) {
      rowErrors.push("year_of_birth must be YYYY");
    }
    if (original.month_of_birth && !/^\d{1,2}$/.test(original.month_of_birth)) {
      rowErrors.push("month_of_birth must be numeric");
    }
    if (original.date_of_birth && !/^\d{1,2}$/.test(original.date_of_birth)) {
      rowErrors.push("date_of_birth must be numeric");
    }
    const sex = normalizeSex(original.sex || "");
    if (!["M", "F", "O", "U"].includes(sex)) {
      rowErrors.push("sex must be M, F, O, or U");
    }
    if (rowErrors.length) {
      errors.push(`Row ${rowNumber}: ${rowErrors.join(", ")}`);
      return;
    }

    rows.push({
      row_number: rowNumber,
      title: original.title || undefined,
      last_name: original.last_name.slice(0, 30),
      first_name: original.first_name.slice(0, 30),
      middle_names: original.middle_names || undefined,
      pref_name: original.pref_name || original.preferred_name || undefined,
      sex,
      year_of_birth: original.year_of_birth,
      month_of_birth: original.month_of_birth.padStart(2, "0"),
      date_of_birth: original.date_of_birth.padStart(2, "0"),
      hin: original.hin || original.phn || undefined,
      ver: original.ver || undefined,
      address: original.address || undefined,
      city: original.city || undefined,
      province: original.province || undefined,
      postal: original.postal || original.postal_code || undefined,
      phone: original.phone || undefined,
      phone2: original.phone2 || original.cell || original.mobile || undefined,
      email: original.email || undefined,
      provider_no: original.provider_no || undefined,
      roster_status: original.roster_status || undefined,
      patient_status: original.patient_status || "AC",
      original,
    });
  });

  return { rows, errors };
}

export default function ClinicOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStepKey>("clinic");
  const [formData, setFormData] = useState<ClinicOnboardingFormData>(
    initialClinicOnboardingFormData,
  );
  const [errors, setErrors] = useState<FieldErrors<ClinicOnboardingFormData>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ClinicPlan | null>(null);
  const [isFlowReady, setIsFlowReady] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("skip");
  const [importFilename, setImportFilename] = useState("");
  const [importCsv, setImportCsv] = useState("");
  const [oscarImportPackage, setOscarImportPackage] = useState<OscarImportPackage | null>(null);
  const [parsedImport, setParsedImport] = useState<ParsedDemographicImport>({
    rows: [],
    errors: [],
  });
  const [importApproved, setImportApproved] = useState(false);

  useEffect(() => {
    const storedPlan = readClinicSelectedPlan();

    if (!storedPlan) {
      window.location.replace("/onboarding/plan");
      return;
    }

    setSelectedPlan(storedPlan);

    const storedState = readClinicOnboardingState();

    if (!storedState) {
      setIsFlowReady(true);
      return;
    }

    setStep(storedState.step);
    setFormData(storedState.formData);
    setIsFlowReady(true);
  }, []);

  useEffect(() => {
    if (!isFlowReady) {
      return;
    }

    storeClinicOnboardingState({
      step,
      formData,
    });
  }, [formData, isFlowReady, step]);

  function getFieldClassName(field: keyof ClinicOnboardingFormData) {
    return `${neutralFieldClassName} ${errors[field] ? invalidFieldClassName : ""}`;
  }

  function getTextareaClassName(field: keyof ClinicOnboardingFormData) {
    return `${neutralTextareaClassName} ${errors[field] ? invalidFieldClassName : ""}`;
  }

  function normalizeFieldValue<K extends keyof ClinicOnboardingFormData>(
    field: K,
    value: ClinicOnboardingFormData[K],
  ): ClinicOnboardingFormData[K] {
    if (typeof value !== "string") {
      return value;
    }

    const normalizers: Partial<
      Record<keyof ClinicOnboardingFormData, (raw: string) => string>
    > = {
      clinicLegalName: normalizeClinicTextInput,
      clinicDisplayName: normalizeClinicTextInput,
      address: capitalizeWordsInput,
      city: normalizeCityNameInput,
      province: capitalizeWordsInput,
      postalCode: formatPostalCode,
      email: (raw) => raw.trimStart().toLowerCase(),
      phoneNumber: formatPhoneNumber,
      servicesProvided: normalizeServicesInput,
      pin: (raw) => raw.replace(/\D/g, "").slice(0, 4),
    };

    return (normalizers[field]?.(value) ?? value) as ClinicOnboardingFormData[K];
  }

  function setField<K extends keyof ClinicOnboardingFormData>(
    field: K,
    value: ClinicOnboardingFormData[K],
  ) {
    const nextValue = normalizeFieldValue(field, value);
    const nextFormData = { ...formData, [field]: nextValue };
    const nextFieldErrors = validateClinicOnboardingStep(step, nextFormData);

    setFormData(nextFormData);
    setErrors((currentErrors) => {
      const nextErrors = {
        ...currentErrors,
        [field]: nextFieldErrors[field] ?? "",
      };

      if (field === "password" || field === "confirmPassword") {
        nextErrors.confirmPassword = nextFieldErrors.confirmPassword ?? "";
      }

      return nextErrors;
    });
    setSubmitError("");
  }

  function getStepIndex(currentStep: OnboardingStepKey) {
    return onboardingStepOrder.indexOf(currentStep);
  }

  function handleBack() {
    const currentStepIndex = getStepIndex(step);

    if (currentStepIndex <= 0) {
      return;
    }

    setStep(onboardingStepOrder[currentStepIndex - 1]);
  }

  function handleAddressSelected(selection: ClinicAddressSelection) {
    setFormData((current) => ({
      ...current,
      address: selection.address || current.address,
      city: selection.city || current.city,
      province: selection.province || current.province,
      postalCode: selection.postalCode
        ? formatPostalCode(selection.postalCode)
        : current.postalCode,
    }));
    setErrors((current) => ({
      ...current,
      address: "",
      city: "",
      province: "",
      postalCode: "",
    }));
    setSubmitError("");
  }

  function updateImportCsv(value: string, filename = importFilename) {
    setImportCsv(value);
    setImportFilename(filename);
    setParsedImport(value.trim() ? parseDemographicCsv(value) : { rows: [], errors: [] });
    setImportApproved(false);
    setSubmitError("");
  }

  async function handleImportFileSelected(file: File | null) {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "xml" && extension !== "zip") {
      setParsedImport({ rows: [], errors: ["OSCAR import file must be .xml or .zip."] });
      setOscarImportPackage(null);
      setImportApproved(false);
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const fileBase64 = dataUrl.split(",", 2)[1] || "";
    setImportFilename(file.name);
    setImportCsv("");
    setOscarImportPackage({
      fileName: file.name,
      fileFormat: extension,
      fileBase64,
      fileSize: file.size,
    });
    setParsedImport({ rows: [], errors: [] });
    setImportApproved(false);
    setSubmitError("");
  }

  function buildApprovedDemographicImport(): DemographicImportPayload | undefined {
    if (importMode !== "import") return undefined;
    if (!importApproved || !oscarImportPackage || parsedImport.errors.length > 0) {
      return undefined;
    }
    return {
      approved: true,
      source_filename: oscarImportPackage.fileName,
      file_format: oscarImportPackage.fileFormat,
      file_content_base64: oscarImportPackage.fileBase64,
      rows: [],
    };
  }

  async function handleContinue() {
    const normalizedFormData = normalizeClinicOnboardingFormData(formData);
    setFormData(normalizedFormData);

    const nextErrors = validateClinicOnboardingStep(step, normalizedFormData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const currentStepIndex = getStepIndex(step);
    const isFinalStep = currentStepIndex === onboardingStepOrder.length - 1;

    if (!isFinalStep) {
      setStep(onboardingStepOrder[currentStepIndex + 1]);
      return;
    }

    if (importMode === "import") {
      if (!oscarImportPackage) {
        setSubmitError("Upload an OSCAR EMR DM .xml file or a .zip containing XML files, or choose continue without import.");
        return;
      }
      if (parsedImport.errors.length > 0) {
        setSubmitError("Fix the demographics import errors before payment.");
        return;
      }
      if (!importApproved) {
        setSubmitError("Approve the demographics preview before continuing to payment.");
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (!selectedPlan) {
        throw new Error("No plan selected. Please go back and choose a plan.");
      }

      const signupResult = await submitClinicOnboarding(
        normalizedFormData,
        selectedPlan.id,
        buildApprovedDemographicImport(),
      );
      storeClinicSignupResult(signupResult);

      // Redirect to Stripe checkout for payment.
      // Stripe will redirect back to /onboarding/billing?success=1 on completion
      // or /onboarding/billing?cancelled=1 if the user cancels.
      if (signupResult.stripeCheckoutUrl) {
        window.location.assign(signupResult.stripeCheckoutUrl);
      } else {
        // No Stripe URL (mock/dev mode) — go straight to billing confirmation
        router.push(
          `/onboarding/billing?success=1&clinic_id=${encodeURIComponent(String(signupResult.clinicId))}&clinic_code=${encodeURIComponent(signupResult.clinicCode)}`,
        );
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "We could not complete registration right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderStepFields() {
    if (step === "credentials") {
      return (
        <>
          <p className="text-sm text-slate-500">
            These credentials are used to sign in to your Bimble dashboard and
            OSCAR EMR. Keep them safe — they cannot be recovered.
          </p>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(event) => setField("password", event.target.value)}
                className={`${getFieldClassName("password")} pr-10`}
                aria-invalid={Boolean(errors.password)}
                autoFocus
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={errors.password} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={(event) =>
                  setField("confirmPassword", event.target.value)
                }
                className={`${getFieldClassName("confirmPassword")} pr-10`}
                aria-invalid={Boolean(errors.confirmPassword)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={errors.confirmPassword} />
          </div>

          <div>
            <label
              htmlFor="pin"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              4-digit PIN
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Used as a secondary access code inside OSCAR EMR.
            </p>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                placeholder="••••"
                maxLength={4}
                value={formData.pin}
                onChange={(event) =>
                  setField("pin", event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className={`${getFieldClassName("pin")} pr-10 tracking-[0.35em]`}
                aria-invalid={Boolean(errors.pin)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <FieldError message={errors.pin} />
          </div>
        </>
      );
    }

    if (step === "clinic") {
      return (
        <>
          <div>
            <label
              htmlFor="clinicLegalName"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Clinic Legal Name
            </label>
            <Input
              id="clinicLegalName"
              placeholder="Bimble Health Services Ltd."
              value={formData.clinicLegalName}
              onChange={(event) =>
                setField("clinicLegalName", event.target.value)
              }
              className={getFieldClassName("clinicLegalName")}
              aria-invalid={Boolean(errors.clinicLegalName)}
              autoFocus
              autoCapitalize="words"
              autoComplete="organization"
            />
            <FieldError message={errors.clinicLegalName} />
          </div>

          <div>
            <label
              htmlFor="clinicDisplayName"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Clinic Display Name
            </label>
            <Input
              id="clinicDisplayName"
              placeholder="Bimble Downtown Clinic"
              value={formData.clinicDisplayName}
              onChange={(event) =>
                setField("clinicDisplayName", event.target.value)
              }
              className={getFieldClassName("clinicDisplayName")}
              aria-invalid={Boolean(errors.clinicDisplayName)}
              autoCapitalize="words"
              autoComplete="organization"
            />
            <FieldError message={errors.clinicDisplayName} />
          </div>

          <div>
            <label
              htmlFor="establishedYear"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Establish Year
            </label>
            <Input
              id="establishedYear"
              type="number"
              inputMode="numeric"
              placeholder="2016"
              value={formData.establishedYear}
              onChange={(event) =>
                setField(
                  "establishedYear",
                  event.target.value.replace(/\D/g, "").slice(0, 4),
                )
              }
              className={getFieldClassName("establishedYear")}
              aria-invalid={Boolean(errors.establishedYear)}
            />
            <FieldError message={errors.establishedYear} />
          </div>
        </>
      );
    }

    if (step === "location") {
      return (
        <>
          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Address
            </label>
            <GooglePlacesAddressInput
              id="address"
              placeholder="Enter the full clinic address"
              value={formData.address}
              onChange={(value) => setField("address", value)}
              onAddressSelected={handleAddressSelected}
              hasError={Boolean(errors.address)}
              autoFocus
            />
            <FieldError message={errors.address} />
          </div>

          <div>
            <label
              htmlFor="city"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              City
            </label>
            <Input
              id="city"
              placeholder="Vancouver"
              value={formData.city}
              onChange={(event) => setField("city", event.target.value)}
              className={getFieldClassName("city")}
              aria-invalid={Boolean(errors.city)}
              autoCapitalize="words"
              autoComplete="address-level2"
            />
            <FieldError message={errors.city} />
          </div>

          <div>
            <label
              htmlFor="province"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Province
            </label>
            <Input
              id="province"
              placeholder="BC"
              value={formData.province}
              onChange={(event) => setField("province", event.target.value)}
              className={getFieldClassName("province")}
              aria-invalid={Boolean(errors.province)}
              autoCapitalize="words"
              autoComplete="address-level1"
            />
            <FieldError message={errors.province} />
          </div>

          <div>
            <label
              htmlFor="postalCode"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Postal Code
            </label>
            <Input
              id="postalCode"
              placeholder="V6B 1A1"
              value={formData.postalCode}
              onChange={(event) =>
                setField("postalCode", formatPostalCode(event.target.value))
              }
              className={getFieldClassName("postalCode")}
              aria-invalid={Boolean(errors.postalCode)}
              autoCapitalize="characters"
              autoComplete="postal-code"
            />
            <FieldError message={errors.postalCode} />
          </div>
        </>
      );
    }

    if (step === "demographics") {
      return (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setImportMode("skip");
                setSubmitError("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                importMode === "skip"
                  ? "border-primary bg-primary/5 text-slate-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="text-sm font-semibold">Continue without import</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Use the existing setup flow and start with empty clinic demographics.
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setImportMode("import");
                setSubmitError("");
              }}
              className={`rounded-xl border p-4 text-left transition ${
                importMode === "import"
                  ? "border-primary bg-primary/5 text-slate-950"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="text-sm font-semibold">Import existing demographics</div>
              <div className="mt-1 text-xs leading-5 text-slate-500">
                Stage an OSCAR EMR DM XML or ZIP before payment and approve it.
              </div>
            </button>
          </div>

          {importMode === "import" ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:border-primary/50">
                  <Upload className="h-4 w-4 text-primary" />
                  Upload XML or ZIP
                  <input
                    type="file"
                    accept=".xml,.zip,application/xml,text/xml,application/zip"
                    className="sr-only"
                    onChange={(event) => void handleImportFileSelected(event.target.files?.[0] ?? null)}
                  />
                </label>
                {importFilename ? (
                  <span className="text-xs font-medium text-slate-500">{importFilename}</span>
                ) : null}
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                Upload the same file OSCAR accepts on its native Import Demographic screen:
                <span className="font-semibold text-slate-900"> .xml</span> or
                <span className="font-semibold text-slate-900"> .zip containing .xml</span>.
                The package is staged before payment and parsed after provisioning.
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Package</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">
                    {oscarImportPackage ? oscarImportPackage.fileFormat.toUpperCase() : "Not uploaded"}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Errors</div>
                  <div className="mt-1 text-xl font-semibold text-slate-950">{parsedImport.errors.length}</div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Destination</div>
                  <div className="mt-1 text-sm font-semibold text-slate-950">Bimble + OSCAR</div>
                </div>
              </div>

              {parsedImport.errors.length > 0 ? (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {parsedImport.errors.slice(0, 8).map((error) => (
                    <div key={error}>{error}</div>
                  ))}
                  {parsedImport.errors.length > 8 ? (
                    <div>And {parsedImport.errors.length - 8} more errors.</div>
                  ) : null}
                </div>
              ) : null}

              {oscarImportPackage ? (
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-3 border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    <span>File</span>
                    <span>Type</span>
                    <span>Size</span>
                  </div>
                  <div className="grid grid-cols-[1.4fr_0.8fr_1fr] gap-3 px-3 py-2 text-sm text-slate-700">
                    <span className="font-medium text-slate-950">{oscarImportPackage.fileName}</span>
                    <span>{oscarImportPackage.fileFormat.toUpperCase()}</span>
                    <span>{Math.max(1, Math.round(oscarImportPackage.fileSize / 1024))} KB</span>
                  </div>
                </div>
              ) : null}

              <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                  checked={importApproved}
                  disabled={!oscarImportPackage || parsedImport.errors.length > 0}
                  onChange={(event) => setImportApproved(event.target.checked)}
                />
                <span>
                  I approve this OSCAR-compatible import package. After payment and provisioning, demographics from this package will be saved into both the clinic PostgreSQL database and the clinic OSCAR database.
                </span>
              </label>
            </div>
          ) : null}
        </>
      );
    }

    return (
      <>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="clinic@bimble.health"
            value={formData.email}
            onChange={(event) => setField("email", event.target.value)}
            className={getFieldClassName("email")}
            aria-invalid={Boolean(errors.email)}
            autoFocus
            autoCapitalize="none"
            autoComplete="email"
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <label
            htmlFor="phoneNumber"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Phone Number
          </label>
          <Input
            id="phoneNumber"
            type="tel"
            placeholder="604 555 0142"
            value={formData.phoneNumber}
            onChange={(event) =>
              setField("phoneNumber", formatPhoneNumber(event.target.value))
            }
            className={getFieldClassName("phoneNumber")}
            aria-invalid={Boolean(errors.phoneNumber)}
            autoComplete="tel"
          />
          <FieldError message={errors.phoneNumber} />
        </div>

        <div>
          <label
            htmlFor="clinicType"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Type of Clinic
          </label>
          <select
            id="clinicType"
            value={formData.clinicType}
            onChange={(event) => setField("clinicType", event.target.value)}
            className={`${neutralSelectClassName} ${
              errors.clinicType ? invalidFieldClassName : ""
            }`}
            aria-invalid={Boolean(errors.clinicType)}
          >
            <option value="">Select clinic type</option>
            {clinicTypeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError message={errors.clinicType} />
        </div>

        <div>
          <label
            htmlFor="servicesProvided"
            className="mb-2 block text-sm font-medium text-slate-900"
          >
            Service Provided
          </label>
          <Textarea
            id="servicesProvided"
            placeholder="Describe the services provided by the clinic"
            value={formData.servicesProvided}
            onChange={(event) =>
              setField("servicesProvided", event.target.value)
            }
            className={getTextareaClassName("servicesProvided")}
            aria-invalid={Boolean(errors.servicesProvided)}
            autoCapitalize="sentences"
          />
          <FieldError message={errors.servicesProvided} />
        </div>
      </>
    );
  }

  const isFirstStep = step === onboardingStepOrder[0];
  const isFinalStep = step === onboardingStepOrder[onboardingStepOrder.length - 1];
  const activeStepIndex = getStepIndex(step);
  const progressWidth = `${((activeStepIndex + 1) / onboardingStepOrder.length) * 100}%`;
  const currentStepTitle = onboardingStepTitles[step];
  const currentStepHelper = onboardingStepHelpers[step];

  if (!isFlowReady) {
    return (
      <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-sm leading-6 text-slate-600">
            Preparing clinic setup...
          </p>
        </div>
      </ClinicFlowShell>
    );
  }

  return (
    <ClinicFlowShell backHref="/onboarding/plan" backLabel="Back to plans">
      <div className="mb-6 max-w-xl space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {currentStepTitle}
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            {currentStepHelper}
          </p>
        </div>

        <div className="h-1.5 w-full rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: progressWidth }}
          />
        </div>

        {selectedPlan ? (
          <div className="flex flex-wrap gap-2 pt-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              Plan: {selectedPlan.name}
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              {selectedPlan.trialDays}-day trial active
            </span>
          </div>
        ) : null}
      </div>

      <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void handleContinue();
          }}
        >
          {renderStepFields()}

          <FieldError message={submitError} />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {!isFirstStep ? (
              <Button
                type="button"
                variant="outline"
                className="h-12 sm:min-w-32"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}

            <Button
              type="submit"
              className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isFinalStep ? (
                isSubmitting ? (
                  "Registering clinic..."
                ) : (
                  "Register & continue to payment"
                )
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ClinicFlowShell>
  );
}
