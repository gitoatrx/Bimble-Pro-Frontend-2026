"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye, FileText, Stethoscope, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import { formatPatientDetails, shouldShowPatientDetails } from "@/lib/appointment-details";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import {
  formatCanadaPacificDateKey,
  getCanadaPacificDateKey,
  shiftCanadaPacificDateKey,
} from "@/lib/time-zone";
import {
  fetchDoctorAppointments,
  fetchDoctorAppointmentPrescriptions,
  startDoctorAppointment,
  type AppointmentFollowUp,
  type DoctorAppointment,
  type DoctorPrescription,
} from "@/lib/api/doctor-dashboard";
import { useRealtimeRefresh } from "@/lib/realtime";

function todayKey() {
  return getCanadaPacificDateKey();
}

function offsetKey(base: string, n: number) {
  return shiftCanadaPacificDateKey(base, n);
}

const TODAY = todayKey();

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  RX_WRITTEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ASSIGNED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  QUEUED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  NO_SHOW: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function FollowUpPanel({ followUp }: { followUp: AppointmentFollowUp }) {
  return (
    <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700">Patient follow-up</p>
      {followUp.status === "SKIPPED" ? (
        <p className="mt-1.5 text-xs text-slate-600">Patient skipped the optional follow-up questions.</p>
      ) : (
        <div className="mt-1.5 grid gap-1.5">
          {followUp.answers.map((item) => (
            <div key={`${item.id}-${item.question}`} className="text-xs">
              <span className="font-medium text-slate-900">{item.question}</span>
              <span className="text-slate-600"> {item.answer}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DoctorAppointmentsPage() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(TODAY);
  const [selectedKey, setSelectedKey] = useState(TODAY);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingAppointmentId, setStartingAppointmentId] = useState<number | null>(null);
  const [openFollowUpIds, setOpenFollowUpIds] = useState<number[]>([]);
  const [openPrescriptionIds, setOpenPrescriptionIds] = useState<number[]>([]);
  const [prescriptionsByAppointment, setPrescriptionsByAppointment] = useState<Record<number, DoctorPrescription[]>>({});
  const [loadingPrescriptionId, setLoadingPrescriptionId] = useState<number | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => offsetKey(weekStart, index)), [weekStart]);

  const loadAppointments = useCallback(async () => {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const from = weekStart;
      const to = offsetKey(weekStart, 6);
      const response = await fetchDoctorAppointments(session.accessToken, { from, to });
      setAppointments(response.appointments ?? []);
    } catch (err) {
      setAppointments([]);
      setError(err instanceof Error ? err.message : "Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useRealtimeRefresh(loadAppointments, {
    paths: ["/appointments", "/pool", "/requests", "/prescriptions"],
  });

  const byDate = useMemo(() => {
    const map = new Map<string, DoctorAppointment[]>();
    for (const appointment of appointments) {
      map.set(appointment.date_key, [...(map.get(appointment.date_key) ?? []), appointment]);
    }
    return map;
  }, [appointments]);

  const dayAppts = byDate.get(selectedKey) ?? [];

  const toggleFollowUp = useCallback((appointmentId: number) => {
    setOpenFollowUpIds((current) =>
      current.includes(appointmentId) ? current.filter((id) => id !== appointmentId) : [...current, appointmentId],
    );
  }, []);

  const jumpToDate = useCallback((dateKey: string) => {
    if (!dateKey) return;
    setSelectedKey(dateKey);
    setWeekStart(dateKey);
  }, []);

  const loadAppointmentPrescriptions = useCallback(async (appointment: DoctorAppointment) => {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      return;
    }
    setLoadingPrescriptionId(appointment.id);
    setError("");
    try {
      const response = await fetchDoctorAppointmentPrescriptions(session.accessToken, appointment.id);
      setPrescriptionsByAppointment((current) => ({
        ...current,
        [appointment.id]: response.prescriptions ?? [],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load prescriptions for this appointment.");
    } finally {
      setLoadingPrescriptionId(null);
    }
  }, []);

  const togglePrescriptions = useCallback(
    async (appointment: DoctorAppointment) => {
      const isOpen = openPrescriptionIds.includes(appointment.id);
      setOpenPrescriptionIds((current) =>
        isOpen ? current.filter((id) => id !== appointment.id) : [...current, appointment.id],
      );
      if (!isOpen && prescriptionsByAppointment[appointment.id] === undefined) {
        await loadAppointmentPrescriptions(appointment);
      }
    },
    [loadAppointmentPrescriptions, openPrescriptionIds, prescriptionsByAppointment],
  );

  async function openPrescriptionDocument(prescription: DoctorPrescription) {
    const session = readDoctorLoginSession();
    const downloadUrl = prescription.download_url || prescription.document_url;
    if (!session?.accessToken || !downloadUrl) return;

    const viewer = window.open("", "_blank");
    if (!viewer) {
      setError("Could not open the prescription. Please allow popups and try again.");
      return;
    }

    try {
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (!response.ok) throw new Error("Could not open prescription document.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      viewer.document.title = prescription.medication || "Prescription";
      viewer.location.href = url;
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      viewer.close();
      setError(err instanceof Error ? err.message : "Could not open prescription document.");
    }
  }

  const handleSeePatient = useCallback(
    async (appointment: DoctorAppointment) => {
      const session = readDoctorLoginSession();
      if (!session?.accessToken) {
        setError("You are not logged in.");
        return;
      }

      setStartingAppointmentId(appointment.id);
      setError("");
      try {
        const response = await startDoctorAppointment(session.accessToken, appointment.id);
        setAppointments((current) =>
          current.map((item) => (item.id === appointment.id ? response.appointment : item)),
        );
        router.push(response.treatment_url || `/doctor/appointments/${appointment.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open the patient record.");
      } finally {
        setStartingAppointmentId(null);
      }
    },
    [router],
  );

  return (
    <DoctorPageShell eyebrow="Schedule" title="Appointments">
      <DoctorSection title="Week view">
        <div className="rounded-[1.5rem] border border-border/70 bg-background p-3.5">
          <div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => setWeekStart((current) => offsetKey(current, -7))}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-lg font-semibold text-foreground">
              {formatCanadaPacificDateKey(weekStart, {
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedKey}
                onChange={(event) => jumpToDate(event.target.value)}
                className="h-10 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              />
              <button
                type="button"
                onClick={() => jumpToDate(TODAY)}
                className="h-10 rounded-2xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Today
              </button>
              <button
                onClick={() => setWeekStart((current) => offsetKey(current, 7))}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {days.map((key) => {
              const weekday = formatCanadaPacificDateKey(key, { weekday: "short" });
              const day = formatCanadaPacificDateKey(key, { day: "numeric" });
              const count = byDate.get(key)?.length ?? 0;
              const isSelected = key === selectedKey;
              const isToday = key === TODAY;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={cn(
                    "flex flex-col items-center rounded-2xl border px-2 py-2.5 text-center transition-all",
                    isSelected
                      ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                      : "border-border/70 bg-card hover:border-primary/20 hover:bg-accent/50",
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-[0.18em]",
                      isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {weekday}
                  </span>
                  <span
                    className={cn(
                      "mt-1 font-display text-lg font-semibold",
                      isSelected ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground",
                    )}
                  >
                    {day}
                  </span>
                  {count > 0 ? (
                    <span
                      className={cn(
                        "mt-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold",
                        isSelected ? "bg-white/20 text-primary-foreground" : "bg-primary/10 text-primary",
                      )}
                    >
                      {count}
                    </span>
                  ) : (
                    <span className="mt-2 h-5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </DoctorSection>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DoctorSection title="Day">
          {loading ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Loading appointments…</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          ) : dayAppts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Free day</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dayAppts.map((appointment) => {
                const patient = appointment.patient && typeof appointment.patient === "object" ? appointment.patient : null;
                const firstString = (...values: Array<unknown>) =>
                  values.find((value) => typeof value === "string" && value.trim()) as string | undefined;
                const patientDetails = shouldShowPatientDetails(appointment.status)
                  ? formatPatientDetails(
                      {
                        status: appointment.status,
                        time: appointment.time,
                        patientAge:
                          appointment.patient_age ??
                          (typeof patient?.age === "number" ? patient.age : null) ??
                          (typeof patient?.age === "string" && patient.age ? Number(patient.age) : null),
                        patientGender:
                          appointment.patient_gender ??
                          appointment.gender ??
                          firstString(patient?.gender, patient?.sex) ??
                          null,
                        patientSex: appointment.patient_sex ?? firstString(patient?.sex) ?? null,
                        gender: appointment.gender ?? firstString(patient?.gender) ?? null,
                        patientDateOfBirth:
                          appointment.patient_date_of_birth ??
                          firstString(
                            patient?.formatted_date_of_birth,
                            patient?.date_of_birth_label,
                            patient?.dob_label,
                            patient?.dob,
                          ) ??
                          null,
                        visitType: appointment.visit_type ?? firstString(patient?.visit_type) ?? null,
                        phoneNumber:
                          appointment.phone_number ??
                          firstString(patient?.phone, patient?.phone_number, patient?.telephone_number) ??
                          null,
                        patientPhoneNumber:
                          appointment.patient_phone_number ??
                          firstString(patient?.phone, patient?.phone_number, patient?.telephone_number) ??
                          null,
                        email: appointment.email ?? firstString(patient?.email, patient?.email_address) ?? null,
                        patientEmail:
                          appointment.patient_email ?? firstString(patient?.email, patient?.email_address) ?? null,
                        phn:
                          appointment.phn ??
                          firstString(patient?.phn, patient?.health_number, patient?.medical_record_number) ??
                          null,
                      },
                      { labelIdentifiers: true },
                    )
                  : [];

                return (
                  <div
                    key={appointment.id}
                    className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 transition-all hover:border-primary/30 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between"
                  >
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                        {appointment.patient_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{appointment.patient_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {appointment.chief_complaint ?? ""}
                        </p>
                        {patientDetails.length > 0 ? (
                          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                            {patientDetails.map((detail) => (
                              <span key={detail}>{detail}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end">
                    <span className="inline-flex items-center rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {appointment.time}
                    </span>
                    {appointment.status !== "ASSIGNED" ? (
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                          STATUS_COLORS[appointment.status] ?? "bg-muted text-muted-foreground",
                        )}
                      >
                        {appointmentLabel(appointment.status)}
                      </span>
                    ) : null}
                    {appointment.has_prescription ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {appointmentLabel("RX_WRITTEN")}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleSeePatient(appointment)}
                      disabled={startingAppointmentId === appointment.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {startingAppointmentId === appointment.id ? (
                        <Stethoscope className="h-3.5 w-3.5 animate-pulse" />
                      ) : (
                        <UserRoundCheck className="h-3.5 w-3.5" />
                      )}
                      See patient
                    </button>
                    {appointment.follow_up ? (
                      <button
                        type="button"
                        onClick={() => toggleFollowUp(appointment.id)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
                      >
                        {openFollowUpIds.includes(appointment.id) ? "Hide follow-up" : "View follow-up"}
                      </button>
                    ) : null}
                  </div>
                  {appointment.follow_up ? (
                    <div className="w-full sm:basis-full sm:pl-14">
                      {openFollowUpIds.includes(appointment.id) ? (
                        <FollowUpPanel followUp={appointment.follow_up} />
                      ) : null}
                    </div>
                  ) : null}
                  {appointment.has_prescription ? (
                    <div className="w-full sm:basis-full">
                      <button
                        type="button"
                        onClick={() => void togglePrescriptions(appointment)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {openPrescriptionIds.includes(appointment.id) ? "Hide prescription" : "View prescription"}
                      </button>
                      {openPrescriptionIds.includes(appointment.id) ? (
                        <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-3 py-3">
                          {loadingPrescriptionId === appointment.id ? (
                            <p className="text-xs font-medium text-emerald-700">Loading prescriptions...</p>
                          ) : (prescriptionsByAppointment[appointment.id] ?? []).length > 0 ? (
                            <div className="space-y-2">
                              {(prescriptionsByAppointment[appointment.id] ?? []).map((prescription) => (
                                <div key={prescription.id} className="flex flex-col gap-2 rounded-xl border border-emerald-100 bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-semibold text-foreground">{prescription.medication}</p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                      {prescription.written_at_label || "Written"}{prescription.dosage ? ` · ${prescription.dosage}` : ""}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => void openPrescriptionDocument(prescription)}
                                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-foreground transition hover:text-primary"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      View
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-emerald-700">No prescription document found for this appointment.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
            </div>
          )}
        </DoctorSection>
      </div>
    </DoctorPageShell>
  );
}
