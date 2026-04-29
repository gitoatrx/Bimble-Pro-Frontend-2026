"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, ReactNode } from "react";
import { ArrowLeft, CheckCircle2, Printer, Save, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { Button } from "@/components/ui/button";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import {
  fetchDoctorAppointment,
  saveDoctorPrescription,
  searchDoctorDrugs,
  type DoctorAppointment,
  type DoctorDrugSearchItem,
  type DoctorPrescriptionRecord,
} from "@/lib/api/doctor-dashboard";
import { cn } from "@/lib/utils";

const LONG_TERM_OPTIONS = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
  { label: "Unknown", value: "unknown" },
];

const FREQUENCIES = ["OD", "BID", "TID", "QID", "QHS", "PRN"];
const ROUTES = ["PO", "SL", "TOP", "INH", "IM", "SC", "IV"];
const METHODS = ["Take", "Apply", "Use", "Inject", "Inhale"];

type PrescriptionForm = {
  instructions: string;
  quantity: string;
  repeats: string;
  noSubstitution: boolean;
  prn: boolean;
  longTerm: string;
  method: string;
  route: string;
  frequency: string;
  takeMin: string;
  takeMax: string;
  duration: string;
  durationUnit: string;
  additionalNote: string;
  signatureDataUrl: string;
  pdfSize: string;
};

const initialForm: PrescriptionForm = {
  instructions: "",
  quantity: "0",
  repeats: "0",
  noSubstitution: false,
  prn: false,
  longTerm: "unknown",
  method: "Take",
  route: "PO",
  frequency: "",
  takeMin: "0",
  takeMax: "0",
  duration: "",
  durationUnit: "",
  additionalNote: "",
  signatureDataUrl: "",
  pdfSize: "A4 page",
};

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
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState<PrescriptionForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [savedPrescription, setSavedPrescription] = useState<DoctorPrescriptionRecord | null>(null);
  const [documentDownloadUrl, setDocumentDownloadUrl] = useState<string | null>(null);
  const [reviewReady, setReviewReady] = useState(false);

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
    const session = readDoctorLoginSession();
    const trimmed = query.trim();
    if (!session?.accessToken || trimmed.length < 2 || selectedDrug?.name === trimmed) {
      setDrugResults([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await searchDoctorDrugs(session.accessToken, trimmed);
        setDrugResults(response.drugs ?? []);
      } catch {
        setDrugResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [query, selectedDrug?.name]);

  const updateForm = <K extends keyof PrescriptionForm>(field: K, value: PrescriptionForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSelectDrug = (drug: DoctorDrugSearchItem) => {
    setSelectedDrug(drug);
    setQuery(drug.name);
    setDrugResults([]);
      setForm((current) => ({
      ...current,
      instructions: current.instructions || `${current.method || "Take"} as directed`,
    }));
    setDocumentDownloadUrl(null);
    setReviewReady(false);
  };

  const canSave = Boolean(selectedDrug && form.instructions.trim());
  const canFinalize = canSave && Boolean(form.signatureDataUrl);

  const buildPrescriptionPayload = () => {
    if (!selectedDrug) return null;
    return {
      drug_catalog_source_id: selectedDrug.source_id,
      drug_code: selectedDrug.drug_code,
      drug_name: selectedDrug.name,
      ingredient: selectedDrug.brand_name || selectedDrug.descriptor,
      instructions: form.instructions,
      quantity: form.quantity,
      repeats: Number.parseInt(form.repeats || "0", 10),
      no_substitution: form.noSubstitution,
      prn: form.prn,
      long_term: form.longTerm,
      method: form.method,
      route: form.route,
      frequency: form.frequency,
      take_min: Number.parseFloat(form.takeMin || "0"),
      take_max: Number.parseFloat(form.takeMax || "0"),
      duration: form.duration,
      duration_unit: form.durationUnit,
      additional_note: form.additionalNote,
      signature_data_url: form.signatureDataUrl,
      signature_label: "Prescriber signature",
      pdf_size: form.pdfSize,
    };
  };

  const handleReview = () => {
    if (!canSave) return;
    setSavedPrescription(null);
    setDocumentDownloadUrl(null);
    setReviewReady(true);
    window.setTimeout(() => document.getElementById("prescription-review")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleSave = async (options: { printAfterSave?: boolean } = {}) => {
    const session = readDoctorLoginSession();
    const payload = buildPrescriptionPayload();
    if (!session?.accessToken || !appointment || !selectedDrug || !payload || !canFinalize) return;

    setSaving(true);
    setError("");
    try {
      const response = await saveDoctorPrescription(session.accessToken, appointment.id, payload);
      setSavedPrescription(response.prescription);
      setDocumentDownloadUrl(response.document?.download_url ?? null);
      setAppointment(response.appointment);
      if (options.printAfterSave) {
        window.setTimeout(() => void handlePrintDocument(response.document?.download_url ?? null), 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save prescription.");
    } finally {
      setSaving(false);
    }
  };

  async function handlePrintDocument(downloadUrl = documentDownloadUrl) {
    const session = readDoctorLoginSession();
    if (!session?.accessToken || !downloadUrl) {
      window.print();
      return;
    }

    setError("");
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
            </div>
          </DoctorSection>

          <DoctorSection
            title="Step 2 · Medication search"
            description="Search the same OSCAR drug catalog copied into Bimble."
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
                  setReviewReady(false);
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
                        {[drug.brand_name, drug.descriptor, drug.drug_identification_number ? `DIN ${drug.drug_identification_number}` : ""]
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
                {selectedDrug.name}
              </div>
            ) : null}
          </DoctorSection>

          <DoctorSection title="Step 3 · Prescription details">
            <div className={cn("grid gap-4", !selectedDrug && "pointer-events-none opacity-50")}>
              <Field label="Instructions">
                <textarea
                  value={form.instructions}
                  onChange={(event) => updateForm("instructions", event.target.value)}
                  className="min-h-24 w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
                  placeholder="Example: Take 1 tablet by mouth twice daily for 7 days"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Qty/Mitte">
                  <input value={form.quantity} onChange={(event) => updateForm("quantity", event.target.value)} className={inputClass()} />
                </Field>
                <Field label="Repeats">
                  <input value={form.repeats} onChange={(event) => updateForm("repeats", event.target.value)} className={inputClass()} />
                </Field>
                <Field label="Long term">
                  <select value={form.longTerm} onChange={(event) => updateForm("longTerm", event.target.value)} className={inputClass()}>
                    {LONG_TERM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={form.noSubstitution}
                    onChange={(event) => updateForm("noSubstitution", event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  No substitution
                </label>
                <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-background px-4 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={form.prn}
                    onChange={(event) => updateForm("prn", event.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                  PRN
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Method">
                  <select value={form.method} onChange={(event) => updateForm("method", event.target.value)} className={inputClass()}>
                    {METHODS.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Route">
                  <select value={form.route} onChange={(event) => updateForm("route", event.target.value)} className={inputClass()}>
                    {ROUTES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Frequency">
                  <select value={form.frequency} onChange={(event) => updateForm("frequency", event.target.value)} className={inputClass()}>
                    <option value="">Select frequency</option>
                    {FREQUENCIES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <Field label="Min">
                  <input value={form.takeMin} onChange={(event) => updateForm("takeMin", event.target.value)} className={inputClass()} />
                </Field>
                <Field label="Max">
                  <input value={form.takeMax} onChange={(event) => updateForm("takeMax", event.target.value)} className={inputClass()} />
                </Field>
                <Field label="Duration">
                  <input value={form.duration} onChange={(event) => updateForm("duration", event.target.value)} className={inputClass()} />
                </Field>
                <Field label="Duration unit">
                  <input value={form.durationUnit} onChange={(event) => updateForm("durationUnit", event.target.value)} className={inputClass()} placeholder="days" />
                </Field>
              </div>
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}

            <div className="mt-5 flex flex-wrap gap-3 print:hidden">
              <Button onClick={handleReview} disabled={!canSave || saving}>
                <Save className="h-4 w-4" />
                Review prescription
              </Button>
              <Button variant="outline" onClick={() => void handlePrintDocument()} disabled={!savedPrescription}>
                <Printer className="h-4 w-4" />
                Print saved PDF
              </Button>
            </div>
          </DoctorSection>

          {reviewReady && selectedDrug ? (
            <DoctorSection
              title="Step 4 · Review, sign, and save"
              description="Final check before the prescription is stored in Bimble and synced to OSCAR."
            >
              <div id="prescription-review" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-2xl border border-slate-300 bg-white p-5 text-slate-950 shadow-sm print:border-0 print:shadow-none">
                  <div className="flex min-h-24 border-2 border-slate-900">
                    <div className="flex w-32 items-center justify-center border-r-2 border-slate-900 font-serif text-7xl">Rx</div>
                    <div className="flex-1 p-4 text-xs leading-5">
                      <p className="font-bold">Prescriber</p>
                      <p>Bimble</p>
                      <p>Clinic prescription workspace</p>
                      <p>Generated inside Bimble</p>
                    </div>
                  </div>
                  <div className="border-x-2 border-b-2 border-slate-900 p-4 text-xs">
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">{appointment.patient_name}</p>
                        <p>{appointment.care_location || "Patient location not recorded"}</p>
                        <p>Health Ins.: {appointment.patient_id}</p>
                      </div>
                      <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="min-h-[360px] border-x-2 border-b-2 border-slate-900 p-4 text-xs">
                    <p className="font-semibold">{selectedDrug.name}</p>
                    <p className="mt-3">
                      Qty:{form.quantity || "0"} Repeats:{form.repeats || "0"}
                      {form.noSubstitution ? " No substitution" : ""}
                      {form.prn ? " PRN" : ""}
                    </p>
                    <p className="mt-2">
                      {form.method} {form.route} {form.frequency ? `Frequency: ${form.frequency}` : ""}
                      {form.duration ? ` Duration: ${form.duration} ${form.durationUnit}` : ""}
                    </p>
                    <p className="mt-3 border-t border-slate-400 pt-2">{form.instructions}</p>
                    {form.additionalNote ? <p className="mt-28 whitespace-pre-wrap">{form.additionalNote}</p> : null}
                    <div className="mt-12">
                      {form.signatureDataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={form.signatureDataUrl} alt="Prescriber signature" className="mb-2 h-16 max-w-64 object-contain" />
                      ) : null}
                      <div className="border-t border-slate-900 pt-2">Signature: Prescriber</div>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[10px] text-slate-600">Created by Bimble</p>
                </div>

                <div className="space-y-5 rounded-2xl border border-border bg-card p-5 print:hidden">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">Actions</h3>
                    <div className="mt-4 grid gap-3">
                      <div className="grid grid-cols-[1fr_auto] gap-3">
                        <Button type="button" variant="outline" onClick={() => void handleSave()} disabled={!canFinalize || saving}>
                          Generate PDF
                        </Button>
                        <select value={form.pdfSize} onChange={(event) => updateForm("pdfSize", event.target.value)} className="rounded-xl border border-border bg-background px-3 text-sm">
                          <option>A4 page</option>
                          <option>Letter page</option>
                        </select>
                      </div>
                      <Button type="button" variant="outline" onClick={() => void handleSave({ printAfterSave: true })} disabled={!canFinalize || saving}>
                        Print
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void handleSave()} disabled={!canFinalize || saving}>
                        Paste into EMR
                      </Button>
                      <Button type="button" variant="outline" onClick={() => void handleSave({ printAfterSave: true })} disabled={!canFinalize || saving}>
                        Print & Paste into EMR
                      </Button>
                      <Button type="button" variant="outline" disabled>
                        Fax & Paste into EMR
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedDrug(null);
                          setQuery("");
                          setDrugResults([]);
                          setForm(initialForm);
                          setReviewReady(false);
                          setSavedPrescription(null);
                          setDocumentDownloadUrl(null);
                        }}
                      >
                        Create New Prescription
                      </Button>
                      <Button type="button" variant="outline" onClick={() => router.back()}>
                        Close Window
                      </Button>
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
                  {savedPrescription ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                      Prescription saved and document created.
                    </div>
                  ) : null}

                  <Button type="button" className="w-full" onClick={() => void handleSave()} disabled={!canFinalize || saving}>
                    <Save className="h-4 w-4" />
                    {saving ? "Saving…" : "Save prescription"}
                  </Button>
                </div>
              </div>
            </DoctorSection>
          ) : null}
        </>
      ) : null}
    </DoctorPageShell>
  );
}
