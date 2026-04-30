"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Printer, Save, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { Button } from "@/components/ui/button";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import {
  fetchDoctorSigAbbreviations,
  fetchDoctorAppointment,
  printDoctorPrescription,
  saveDoctorPrescription,
  searchDoctorDrugs,
  type DoctorAppointment,
  type DoctorDrugSearchItem,
  type DoctorPrescriptionRecord,
  type DoctorSigAbbreviation,
} from "@/lib/api/doctor-dashboard";
import { cn } from "@/lib/utils";
import { formatIsoDateToDisplay } from "@/lib/date-format";

type PrescriptionForm = {
  noSubstitution: boolean;
  additionalNote: string;
  signatureDataUrl: string;
  pdfSize: string;
};

const initialForm: PrescriptionForm = {
  noSubstitution: false,
  additionalNote: "",
  signatureDataUrl: "",
  pdfSize: "A4 page",
};

type MedicationDraft = {
  localId: string;
  drugCatalogSourceId: number | null;
  drugCode: string | null;
  drugName: string;
  ingredient: string | null;
  dosageForm: string | null;
  routeLabel: string | null;
  drugCategory: string | null;
  isNarcotic: boolean;
  technicalReasons: NonNullable<DoctorDrugSearchItem["technical_reasons"]>;
  selectedReason: string;
  instructions: string;
  specialInstructions: string;
  quantity: string;
  repeats: string;
  startDate: string;
  durationDays: string;
  endDate: string;
  sigDose: string;
  sigRoute: string;
  sigFrequency: string;
  sigTiming: string;
  sigModifier: string;
};

const DEFAULT_DURATION_DAYS = 30;

const FREQUENCY_OPTIONS = [
  { code: "OD", label: "Once daily", dosesPerDay: 1 },
  { code: "BID", label: "Twice daily", dosesPerDay: 2 },
  { code: "TID", label: "Three times daily", dosesPerDay: 3 },
  { code: "QID", label: "Four times daily", dosesPerDay: 4 },
  { code: "QHS", label: "At bedtime", dosesPerDay: 1 },
  { code: "Q4H", label: "Every 4 hours", dosesPerDay: 6 },
  { code: "Q6H", label: "Every 6 hours", dosesPerDay: 4 },
  { code: "Q8H", label: "Every 8 hours", dosesPerDay: 3 },
  { code: "Q12H", label: "Every 12 hours", dosesPerDay: 2 },
  { code: "PRN", label: "As needed", dosesPerDay: null },
];

function dateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + Math.max(days, 1) - 1);
  return dateInputValue(date);
}

function SignaturePad({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  const commit = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  }, [onChange]);

  const prepareCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f2545";
  }, []);

  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    prepareCanvas();
    onChange("");
  };

  useEffect(() => {
    prepareCanvas();
  }, [prepareCanvas]);

  return (
    <div className="rounded-2xl border border-border bg-background p-2">
      <canvas
        ref={canvasRef}
        width={720}
        height={170}
        className="h-36 w-full touch-none rounded-xl bg-white"
        onPointerDown={(event) => {
          drawingRef.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          const context = event.currentTarget.getContext("2d");
          const start = point(event);
          context?.beginPath();
          context?.moveTo(start.x, start.y);
        }}
        onPointerMove={(event) => {
          if (!drawingRef.current) return;
          const context = event.currentTarget.getContext("2d");
          const next = point(event);
          context?.lineTo(next.x, next.y);
          context?.stroke();
        }}
        onPointerUp={(event) => {
          drawingRef.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          commit();
        }}
        onPointerCancel={(event) => {
          drawingRef.current = false;
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          commit();
        }}
        onPointerLeave={() => {
          if (!drawingRef.current) return;
          drawingRef.current = false;
          commit();
        }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{value ? "Signature captured" : "Please sign in the box above."}</span>
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          Clear
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function inputClass() {
  return "h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15";
}

function withoutCommas(value: string | null | undefined) {
  return (value || "").replace(/,/g, " ").replace(/\s+/g, " ").trim();
}

function routeCodeFromDrug(drug: Pick<DoctorDrugSearchItem, "route" | "dosage_form" | "name">) {
  const route = (drug.route || "").toLowerCase();
  const form = `${drug.dosage_form || ""} ${drug.name || ""}`.toLowerCase();
  if (route.includes("oral")) return "PO";
  if (route.includes("topical") || /cream|ointment|gel|lotion|shampoo|patch/.test(form)) return "TOP";
  if (route.includes("inhal") || /inhal|puff|neb/.test(form)) return "INH";
  if (route.includes("nasal")) return "IN";
  if (route.includes("rectal")) return "PR";
  if (route.includes("vaginal")) return "PV";
  if (route.includes("intramuscular")) return "IM";
  if (route.includes("subcutaneous")) return "SC";
  if (route.includes("intravenous")) return "IV";
  if (/inject|vial|syringe|pen/.test(form)) return "";
  return route ? "" : "PO";
}

function inferFrequencyCode(text: string) {
  const value = text.toLowerCase();
  if (/every\s*12\s*hours|q12h|twice daily|two times daily|bid/.test(value)) return "Q12H";
  if (/every\s*8\s*hours|q8h|three times daily|tid/.test(value)) return "Q8H";
  if (/every\s*6\s*hours|q6h/.test(value)) return "Q6H";
  if (/every\s*4\s*hours|q4h/.test(value)) return "Q4H";
  if (/four times daily|qid/.test(value)) return "QID";
  if (/at bedtime|qhs|bedtime/.test(value)) return "QHS";
  if (/once daily|daily|od\b|qd\b/.test(value)) return "OD";
  if (/as needed|prn/.test(value)) return "PRN";
  return "";
}

function inferDose(text: string) {
  const match = text.match(/\b(?:take|apply|inhale|instill|insert|inject)\s+([0-9]+(?:\.[0-9]+)?(?:\s*(?:tablet|tablets|capsule|capsules|mL|mg|puff|puffs|drop|drops|unit|units|patch|patches))?)/i);
  return match?.[1]?.trim() || "1";
}

function inferDurationDays(text: string) {
  const match = text.match(/\bfor\s+([0-9]+)(?:\s*-\s*[0-9]+)?\s*(day|days|week|weeks|month|months)\b/i);
  if (!match) return DEFAULT_DURATION_DAYS;
  const amount = Number.parseInt(match[1], 10);
  if (!Number.isFinite(amount) || amount <= 0) return DEFAULT_DURATION_DAYS;
  const unit = match[2].toLowerCase();
  if (unit.startsWith("week")) return amount * 7;
  if (unit.startsWith("month")) return amount * 30;
  return amount;
}

function quantityFromDose(dose: string, frequencyCode: string, durationDays: string) {
  const duration = Number.parseInt(durationDays || "0", 10);
  const doseAmount = Number.parseFloat(dose || "1");
  const option = FREQUENCY_OPTIONS.find((item) => item.code === frequencyCode);
  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(doseAmount) || !option?.dosesPerDay) {
    return duration > 0 ? String(duration) : "";
  }
  const total = doseAmount * option.dosesPerDay * duration;
  return Number.isInteger(total) ? String(total) : String(Number(total.toFixed(2)));
}

function applySigDefaults(medicine: MedicationDraft, sig: string): MedicationDraft {
  const frequency = inferFrequencyCode(sig);
  const durationDays = String(inferDurationDays(sig));
  return {
    ...medicine,
    instructions: sig,
    sigDose: inferDose(sig),
    sigFrequency: frequency,
    sigModifier: frequency === "PRN" ? "PRN" : medicine.sigModifier,
    durationDays,
    endDate: addDays(medicine.startDate, Number.parseInt(durationDays, 10)),
    quantity: quantityFromDose(inferDose(sig), frequency, durationDays),
  };
}

export default function DoctorAppointmentTreatmentPage() {
  const params = useParams<{ appointmentId: string }>();
  const router = useRouter();
  const appointmentId = useMemo(() => Number(params.appointmentId), [params.appointmentId]);
  const [appointment, setAppointment] = useState<DoctorAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [drugResults, setDrugResults] = useState<DoctorDrugSearchItem[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<DoctorDrugSearchItem | null>(null);
  const [medications, setMedications] = useState<MedicationDraft[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState<PrescriptionForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<DoctorPrescriptionRecord | null>(null);
  const [documentDownloadUrl, setDocumentDownloadUrl] = useState<string | null>(null);
  const [printMessage, setPrintMessage] = useState("");
  const [sigAbbreviations, setSigAbbreviations] = useState<DoctorSigAbbreviation[]>([]);

  const loadAppointment = useCallback(async () => {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }
    if (!Number.isFinite(appointmentId)) {
      setError("Invalid appointment.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetchDoctorAppointment(session.accessToken, appointmentId);
      setAppointment(response.appointment);
    } catch (err) {
      setAppointment(null);
      setError(err instanceof Error ? err.message : "Failed to load patient record.");
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    void loadAppointment();
  }, [loadAppointment]);

  useEffect(() => {
    let cancelled = false;
    fetchDoctorSigAbbreviations()
      .then((items) => {
        if (!cancelled) setSigAbbreviations(items);
      })
      .catch(() => {
        if (!cancelled) setSigAbbreviations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const session = readDoctorLoginSession();
    const trimmed = query.trim();
    if (!session?.accessToken || trimmed.length < 2 || selectedDrug?.name === trimmed) {
      setDrugResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await searchDoctorDrugs(session.accessToken, trimmed, {
          signal: controller.signal,
        });
        setDrugResults(response.drugs ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setDrugResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selectedDrug?.name]);

  const updateForm = <K extends keyof PrescriptionForm>(field: K, value: PrescriptionForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const sigByCode = useMemo(
    () => new Map(sigAbbreviations.map((item) => [item.code, item])),
    [sigAbbreviations],
  );
  const sigText = useCallback((code: string) => sigByCode.get(code)?.plain_language ?? "", [sigByCode]);
  const sigDoseNumber = (value: string) => {
    const parsed = Number.parseFloat(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  };

  const buildSigInstruction = useCallback(
    (medicine: Pick<MedicationDraft, "sigDose" | "sigRoute" | "sigFrequency" | "sigTiming" | "sigModifier">) => {
      const parts = ["Take"];
      if (medicine.sigDose.trim()) parts.push(medicine.sigDose.trim());
      if (medicine.sigRoute) parts.push(sigText(medicine.sigRoute));
      if (medicine.sigFrequency) parts.push(sigText(medicine.sigFrequency));
      if (medicine.sigTiming && medicine.sigTiming !== medicine.sigFrequency) parts.push(sigText(medicine.sigTiming));
      if (medicine.sigModifier && medicine.sigModifier !== medicine.sigTiming) parts.push(sigText(medicine.sigModifier));
      return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    },
    [sigText],
  );

  const handleSelectDrug = (drug: DoctorDrugSearchItem) => {
    const startDate = dateInputValue();
    const suggestedInstructions = drug.suggested_sig || "Take 1 by mouth";
    const durationDays = inferDurationDays(suggestedInstructions);
    const frequency = inferFrequencyCode(suggestedInstructions);
    const dose = inferDose(suggestedInstructions);
    const route = routeCodeFromDrug(drug);
    const newMedication: MedicationDraft = {
      localId: `${drug.source_id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      drugCatalogSourceId: drug.source_id,
      drugCode: drug.drug_code,
      drugName: drug.name,
      ingredient: drug.brand_name || drug.descriptor,
      dosageForm: drug.dosage_form ?? drug.descriptor,
      routeLabel: drug.route ?? null,
      drugCategory: drug.drug_category ?? null,
      isNarcotic: Boolean(drug.is_narcotic),
      technicalReasons: drug.technical_reasons ?? [],
      selectedReason: drug.technical_reasons?.[0]?.technical_reason ?? "",
      instructions: suggestedInstructions,
      specialInstructions: "",
      quantity: quantityFromDose(dose, frequency, String(durationDays)),
      repeats: "0",
      startDate,
      durationDays: String(durationDays),
      endDate: addDays(startDate, durationDays),
      sigDose: dose,
      sigRoute: route,
      sigFrequency: frequency,
      sigTiming: "",
      sigModifier: frequency === "PRN" ? "PRN" : "",
    };
    setSelectedDrug(drug);
    setMedications((current) => [...current, newMedication]);
    setQuery("");
    setDrugResults([]);
    setDocumentDownloadUrl(null);
  };

  const updateMedication = <K extends keyof MedicationDraft>(localId: string, field: K, value: MedicationDraft[K]) => {
    setMedications((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;
        const next = { ...item, [field]: value };
        if (field === "startDate" || field === "durationDays") {
          const days = Number.parseInt(String(field === "durationDays" ? value : next.durationDays), 10);
          next.endDate = next.startDate && Number.isFinite(days) ? addDays(next.startDate, days) : next.endDate;
          next.quantity = quantityFromDose(next.sigDose, next.sigFrequency, next.durationDays);
        }
        if (field === "endDate" && next.startDate && value) {
          const start = new Date(`${next.startDate}T00:00:00`);
          const end = new Date(`${String(value)}T00:00:00`);
          const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
          if (Number.isFinite(diff) && diff > 0) {
            next.durationDays = String(diff);
            next.quantity = quantityFromDose(next.sigDose, next.sigFrequency, next.durationDays);
          }
        }
        return next;
      }),
    );
    setSavedPrescription(null);
    setDocumentDownloadUrl(null);
    setPrintMessage("");

  };

  const updateMedicationSig = <K extends keyof MedicationDraft>(localId: string, field: K, value: MedicationDraft[K]) => {
    setMedications((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;
        const next = { ...item, [field]: value };
        const updated = { ...next, instructions: buildSigInstruction(next) };
        if (field === "sigDose" || field === "sigFrequency") {
          updated.quantity = quantityFromDose(updated.sigDose, updated.sigFrequency, updated.durationDays);
        }
        return updated;
      }),
    );
    setSavedPrescription(null);
    setDocumentDownloadUrl(null);
    setPrintMessage("");

  };

  const applySuggestedSig = (localId: string, reason: string, sig: string) => {
    setMedications((current) =>
      current.map((item) => {
        if (item.localId !== localId) return item;
        return applySigDefaults({ ...item, selectedReason: reason }, sig);
      }),
    );
    setSavedPrescription(null);
    setDocumentDownloadUrl(null);
    setPrintMessage("");

  };

  const removeMedication = (localId: string) => {
    setMedications((current) => current.filter((item) => item.localId !== localId));
    setSavedPrescription(null);
    setDocumentDownloadUrl(null);
    setPrintMessage("");

  };

  const canSave = medications.length > 0 && medications.every((item) => item.drugName.trim() && item.instructions.trim());
  const canFinalize = canSave && Boolean(form.signatureDataUrl);

  const buildPrescriptionPayload = () => {
    const primary = medications[0];
    if (!primary) return null;
    const instructionFor = (item: MedicationDraft) =>
      [item.instructions.trim(), item.specialInstructions.trim()].filter(Boolean).join(" ");
    return {
      drug_catalog_source_id: primary.drugCatalogSourceId,
      drug_code: primary.drugCode,
      drug_name: primary.drugName,
      ingredient: primary.ingredient,
      instructions: instructionFor(primary),
      quantity: primary.quantity,
      repeats: Number.parseInt(primary.repeats || "0", 10),
      medications: medications.map((item) => ({
        drug_catalog_source_id: item.drugCatalogSourceId,
        drug_code: item.drugCode,
        drug_name: item.drugName,
        ingredient: item.ingredient,
        instructions: instructionFor(item),
        dosage: instructionFor(item),
        quantity: item.quantity,
        repeats: Number.parseInt(item.repeats || "0", 10),
        route: item.sigRoute || null,
        start_date: item.startDate,
        end_date: item.endDate,
        duration_days: Number.parseInt(item.durationDays || "0", 10) || null,
      })),
      no_substitution: form.noSubstitution,
      prn: primary.sigModifier === "PRN" || primary.sigFrequency === "PRN",
      route: primary.sigRoute || "PO",
      frequency: primary.sigFrequency === "PRN" ? null : primary.sigFrequency || primary.sigTiming || null,
      take_min: sigDoseNumber(primary.sigDose),
      take_max: sigDoseNumber(primary.sigDose),
      duration: primary.durationDays,
      duration_unit: "days",
      additional_note: form.additionalNote,
      signature_data_url: form.signatureDataUrl,
      signature_label: "Prescriber signature",
      pdf_size: form.pdfSize,
    };
  };

  const handleSave = async (options: { printAfterSave?: boolean } = {}) => {
    const session = readDoctorLoginSession();
    const payload = buildPrescriptionPayload();
    if (!session?.accessToken || !appointment || !payload || !canFinalize) return;

    setSaving(true);
    setError("");
    try {
      const response = await saveDoctorPrescription(session.accessToken, appointment.id, payload);
      setSavedPrescription(response.prescription);
      setDocumentDownloadUrl(response.document?.download_url ?? null);
      setAppointment(response.appointment);
      if (options.printAfterSave) {
        window.setTimeout(
          () => void handlePrintDocument(response.document?.download_url ?? null, response.prescription.prescription_id),
          100,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save prescription.");
    } finally {
      setSaving(false);
    }
  };

  async function handlePrintDocument(downloadUrl = documentDownloadUrl, prescriptionId = savedPrescription?.prescription_id) {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      window.print();
      return;
    }

    setError("");
    setPrintMessage("");
    if (prescriptionId) {
      try {
        const response = await printDoctorPrescription(session.accessToken, prescriptionId);
        setPrintMessage(response.printer ? `${response.message} Printer: ${response.printer}` : response.message);
        return;
      } catch (err) {
        setPrintMessage(
          err instanceof Error
            ? `Server print was not available: ${err.message}. Opening the PDF instead.`
            : "Server print was not available. Opening the PDF instead.",
        );
      }
    }

    if (!downloadUrl) {
      window.print();
      return;
    }

    try {
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Could not open prescription document.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => {
        try {
          printWindow?.focus();
          printWindow?.print();
        } catch {
          // The PDF is still opened if the browser blocks script-triggered print.
        }
      }, 600);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open prescription document.");
    }
  }

  const reason = appointment?.chief_complaint || appointment?.user_friendly_service_name || appointment?.service || "Appointment";

  return (
    <DoctorPageShell eyebrow="Patient care" title={appointment?.patient_name || "Patient record"}>
      <div className="print:hidden">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {loading ? (
        <DoctorSection>
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Loading patient workspace…</p>
          </div>
        </DoctorSection>
      ) : error && !appointment ? (
        <DoctorSection>
          <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        </DoctorSection>
      ) : appointment ? (
        <>
          <DoctorSection title="Step 1 · Visit reason">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Reason</p>
              <p className="mt-1 font-display text-xl font-semibold text-foreground">{reason}</p>
              {appointment.patient_age ? (
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  Patient age: {appointment.patient_age} years
                  {appointment.patient_date_of_birth
                    ? ` · DOB ${formatIsoDateToDisplay(appointment.patient_date_of_birth)}`
                    : ""}
                </p>
              ) : null}
            </div>
          </DoctorSection>

          <DoctorSection
            title="Step 2 · Medication search"
            description="Search the OatRx medication catalog."
            className="relative z-30 overflow-visible"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedDrug(null);
                  setSavedPrescription(null);
                  setDocumentDownloadUrl(null);
                  setPrintMessage("");

                }}
                className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                placeholder="Enter drug name..."
              />
              {drugResults.length > 0 || searching ? (
                <div className="absolute left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl">
                  {searching ? <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p> : null}
                  {drugResults.map((drug) => (
                    <button
                      key={drug.source_id}
                      type="button"
                      onClick={() => handleSelectDrug(drug)}
                      className="flex w-full flex-col rounded-xl px-3 py-2 text-left transition hover:bg-accent/50"
                    >
                      <span className="text-sm font-semibold text-foreground">{drug.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {[drug.brand_name, drug.descriptor, drug.route, drug.drug_category]
                          .filter(Boolean)
                          .join(" · ") || "OSCAR drugref"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {selectedDrug ? (
              <div className="mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Added {selectedDrug.name}
              </div>
            ) : null}
          </DoctorSection>

          <DoctorSection title="Step 3 · Prescription details">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className={cn("grid gap-4", medications.length === 0 && "opacity-70")}>
              {medications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm font-medium text-muted-foreground">
                  Search and select one or more medicines above. Each medicine will get its own quick dose and date controls here.
                </div>
              ) : null}

              {medications.map((medicine, index) => (
                <div key={medicine.localId} className="rounded-3xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Medicine {index + 1}</p>
                      <h3 className="mt-1 font-display text-lg font-semibold text-foreground">{medicine.drugName}</h3>
                      {medicine.ingredient ? <p className="text-xs text-muted-foreground">{medicine.ingredient}</p> : null}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeMedication(medicine.localId)}>
                      Remove
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
                      <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                        {[medicine.dosageForm, medicine.routeLabel, medicine.drugCategory, medicine.isNarcotic ? "Narcotic" : ""]
                          .filter(Boolean)
                          .map((item) => (
                            <span key={item} className="rounded-full bg-background px-3 py-1">
                              {item}
                            </span>
                          ))}
                      </div>
                      {medicine.technicalReasons.length > 0 ? (
                        <div className="mt-3 grid gap-2">
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            OatRx suggested instructions
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {medicine.technicalReasons.slice(0, 5).flatMap((reasonItem) =>
                              reasonItem.sigs.slice(0, 2).map((sig) => (
                                <button
                                  key={`${reasonItem.technical_reason}-${sig}`}
                                  type="button"
                                  onClick={() => applySuggestedSig(medicine.localId, reasonItem.technical_reason, sig)}
                                  className={cn(
                                    "rounded-2xl border px-3 py-2 text-left text-xs font-semibold transition hover:border-primary/50 hover:bg-background",
                                    medicine.instructions === sig
                                      ? "border-primary bg-background text-primary"
                                      : "border-border bg-white text-foreground",
                                  )}
                                >
                                  <span className="block text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                    {reasonItem.technical_reason || "Suggested SIG"}
                                  </span>
                                  {sig}
                                </button>
                              )),
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <Field label="System instruction">
                      <textarea
                        value={medicine.instructions}
                        onChange={(event) => updateMedication(medicine.localId, "instructions", event.target.value)}
                        className="min-h-20 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                        placeholder="Example: Take 1 tablet by mouth once daily"
                      />
                    </Field>

                    <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1fr]">
                      <Field label="Dose">
                        <input
                          value={medicine.sigDose}
                          onChange={(event) => updateMedicationSig(medicine.localId, "sigDose", event.target.value)}
                          className={inputClass()}
                          placeholder="1"
                        />
                      </Field>
                      <Field label="Frequency">
                        <select
                          value={medicine.sigFrequency}
                          onChange={(event) => updateMedicationSig(medicine.localId, "sigFrequency", event.target.value)}
                          className={inputClass()}
                        >
                          <option value="">Select frequency</option>
                          {FREQUENCY_OPTIONS.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Qty/Mitte">
                        <input
                          value={medicine.quantity}
                          onChange={(event) => updateMedication(medicine.localId, "quantity", event.target.value)}
                          className={inputClass()}
                        />
                      </Field>
                      <Field label="Repeats">
                        <input
                          value={medicine.repeats}
                          onChange={(event) => updateMedication(medicine.localId, "repeats", event.target.value)}
                          className={inputClass()}
                        />
                      </Field>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <Field label="Start date">
                        <input
                          type="date"
                          value={medicine.startDate}
                          onChange={(event) => updateMedication(medicine.localId, "startDate", event.target.value)}
                          className={inputClass()}
                        />
                      </Field>
                      <Field label="Duration days">
                        <input
                          value={medicine.durationDays}
                          onChange={(event) => updateMedication(medicine.localId, "durationDays", event.target.value)}
                          className={inputClass()}
                        />
                      </Field>
                      <Field label="End date">
                        <input
                          type="date"
                          value={medicine.endDate}
                          onChange={(event) => updateMedication(medicine.localId, "endDate", event.target.value)}
                          className={inputClass()}
                        />
                      </Field>
                    </div>

                    <Field label="Special instructions">
                      <textarea
                        value={medicine.specialInstructions}
                        onChange={(event) => updateMedication(medicine.localId, "specialInstructions", event.target.value)}
                        className="min-h-16 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                        placeholder="Optional: with food, affected area, left eye, counselling note..."
                      />
                    </Field>
                  </div>
                </div>
              ))}

              <div className="grid gap-3">
                <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={!form.noSubstitution}
                    onChange={(event) => updateForm("noSubstitution", !event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  Substitution allowed
                </label>
              </div>
            </div>

            {medications.length > 0 ? (
              <div className="space-y-5 rounded-2xl border border-border bg-card p-4 print:hidden">
                <div id="prescription-preview" className="rounded-2xl border border-slate-300 bg-white p-5 text-slate-950 shadow-sm">
                  <div className="flex min-h-24 border-2 border-slate-900">
                    <div className="flex w-32 items-center justify-center border-r-2 border-slate-900 font-serif text-7xl">Rx</div>
                    <div className="flex-1 p-4 text-xs leading-5">
                      <p>Bimble</p>
                      <p>Clinic prescription workspace</p>
                    </div>
                  </div>
                  <div className="border-x-2 border-b-2 border-slate-900 p-4 text-xs">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">{appointment.patient_name}</p>
                        <p>{withoutCommas(appointment.care_location) || "Patient location not recorded"}</p>
                        <p>Health Ins.: {appointment.patient_id}</p>
                      </div>
                      <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="min-h-[360px] border-x-2 border-b-2 border-slate-900 p-4 text-xs">
                    {medications.map((medicine, index) => (
                      <div key={medicine.localId} className={cn(index > 0 && "mt-5 border-t border-slate-400 pt-4")}>
                        <p className="font-semibold">
                          Rx {index + 1} - {medicine.drugName}
                        </p>
                        <p className="mt-3">
                          Qty:{medicine.quantity || "0"} Repeats:{medicine.repeats || "0"}
                        </p>
                        <p className="mt-2">{form.noSubstitution ? "No substitution" : "Substitution allowed"}</p>
                        <p className="mt-1">
                          Start: {medicine.startDate || "N/A"} End: {medicine.endDate || "N/A"}
                        </p>
                        <p className="mt-3 border-t border-slate-400 pt-2">
                          {[medicine.instructions, medicine.specialInstructions].filter(Boolean).join(" ")}
                        </p>
                      </div>
                    ))}
                    {form.additionalNote ? <p className="mt-28 whitespace-pre-wrap">{form.additionalNote}</p> : null}
                    <div className="mt-12">
                      {form.signatureDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.signatureDataUrl} alt="Prescriber signature" className="mb-2 h-16 max-w-64 object-contain" />
                      ) : null}
                      <div className="border-t border-slate-900 pt-2">
                        <p className="font-semibold">Prescriber</p>
                        <p>Provider #: N/A</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] lowercase text-slate-600">
                    <span>generated by bimble</span>
                    <span>page 1 of 1</span>
                  </div>
                </div>

                <Field label="Additional notes to add to Rx">
                  <textarea
                    value={form.additionalNote}
                    onChange={(event) => updateForm("additionalNote", event.target.value)}
                    className="min-h-20 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                    placeholder="Add final note before saving"
                  />
                </Field>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Signature</span>
                  <SignaturePad value={form.signatureDataUrl} onChange={(value) => updateForm("signatureDataUrl", value)} />
                </div>

                {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
                {printMessage ? <p className="text-sm font-medium text-muted-foreground">{printMessage}</p> : null}
                {savedPrescription ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    Prescription saved and document created.
                  </div>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button type="button" className="w-full" onClick={() => void handleSave()} disabled={!canFinalize || saving}>
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save prescription"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => (savedPrescription ? void handlePrintDocument() : void handleSave({ printAfterSave: true }))}
                    disabled={!canFinalize || saving}
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            ) : null}
            </div>
          </DoctorSection>
        </>
      ) : null}
    </DoctorPageShell>
  );
}
