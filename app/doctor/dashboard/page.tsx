"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Stethoscope, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import { formatPatientDetails, shouldShowPatientDetails } from "@/lib/appointment-details";
import {
  readDoctorLoginSession,
  readDoctorSessionSnapshot,
  subscribeToDoctorSessionChanges,
} from "@/lib/doctor/session";
import { formatCanadaPacificDateKey } from "@/lib/time-zone";
import {
  fetchDoctorSummary,
  fetchDoctorToday,
  startDoctorAppointment,
  type AppointmentFollowUp,
  type DoctorAppointment,
  type DoctorSummary,
  type DoctorTodayResponse,
} from "@/lib/api/doctor-dashboard";
import { useRealtimeRefresh } from "@/lib/realtime";

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  RX_WRITTEN: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  ASSIGNED: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  QUEUED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  NO_SHOW: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  CANCELLED: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function formatTodayLabel(value?: string) {
  if (!value) return "Today";
  return formatCanadaPacificDateKey(value, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function FollowUpPanel({ followUp }: { followUp: AppointmentFollowUp }) {
  return (
    <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Patient follow-up</p>
      {followUp.status === "SKIPPED" ? (
        <p className="mt-2 text-sm text-slate-600">Patient skipped the optional follow-up questions.</p>
      ) : (
        <div className="mt-2 grid gap-2">
          {followUp.answers.map((item) => (
            <div key={`${item.id}-${item.question}`} className="text-sm">
              <span className="font-medium text-slate-900">{item.question}</span>
              <span className="text-slate-600"> {item.answer}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QueueRow({
  appointment,
  highlight = false,
  isStarting = false,
  followUpOpen = false,
  onSeePatient,
  onToggleFollowUp,
}: {
  appointment: DoctorAppointment;
  highlight?: boolean;
  isStarting?: boolean;
  followUpOpen?: boolean;
  onSeePatient: (appointment: DoctorAppointment) => void;
  onToggleFollowUp: (appointmentId: number) => void;
}) {
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
            appointment.patient_gender ?? appointment.gender ?? firstString(patient?.gender, patient?.sex) ?? null,
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
            appointment.phone_number ?? firstString(patient?.phone, patient?.phone_number, patient?.telephone_number) ?? null,
          patientPhoneNumber:
            appointment.patient_phone_number ??
            firstString(patient?.phone, patient?.phone_number, patient?.telephone_number) ??
            null,
          email: appointment.email ?? firstString(patient?.email, patient?.email_address) ?? null,
          patientEmail: appointment.patient_email ?? firstString(patient?.email, patient?.email_address) ?? null,
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
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-3 py-3",
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-background",
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
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

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:justify-end">
          {appointment.status !== "ASSIGNED" ? (
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                STATUS_COLORS[appointment.status] ?? "bg-muted text-muted-foreground",
              )}
            >
              {appointmentLabel(appointment.status)}
            </span>
          ) : null}
          {appointment.has_prescription ? (
            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {appointmentLabel("RX_WRITTEN")}
            </span>
          ) : null}
          <Button
            size="sm"
            onClick={() => onSeePatient(appointment)}
            disabled={isStarting}
            className="h-8 rounded-full px-3 text-xs"
          >
            {isStarting ? (
              <Stethoscope className="h-3.5 w-3.5 animate-pulse" />
            ) : (
              <UserRoundCheck className="h-3.5 w-3.5" />
            )}
            See patient
          </Button>
          {appointment.follow_up ? (
            <button
              type="button"
              onClick={() => onToggleFollowUp(appointment.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100"
            >
              {followUpOpen ? "Hide follow-up" : "View follow-up"}
            </button>
          ) : null}
        </div>
      </div>
      {appointment.follow_up && followUpOpen ? (
        <div className="w-full sm:pl-14">
          <FollowUpPanel followUp={appointment.follow_up} />
        </div>
      ) : null}
    </div>
  );
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const sessionRaw = useSyncExternalStore(
    subscribeToDoctorSessionChanges,
    readDoctorSessionSnapshot,
    () => null,
  );
  const session = useMemo(() => {
    if (!sessionRaw) return null;
    return readDoctorLoginSession();
  }, [sessionRaw]);
  const [summary, setSummary] = useState<DoctorSummary | null>(null);
  const [today, setToday] = useState<DoctorTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startingAppointmentId, setStartingAppointmentId] = useState<number | null>(null);
  const [openFollowUpIds, setOpenFollowUpIds] = useState<number[]>([]);

  const loadData = useCallback(async () => {
    if (!session?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    try {
      const [summaryResponse, todayResponse] = await Promise.all([
        fetchDoctorSummary(session.accessToken),
        fetchDoctorToday(session.accessToken),
      ]);
      setSummary(summaryResponse);
      setToday(todayResponse);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load doctor dashboard.");
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useRealtimeRefresh(loadData, {
    paths: ["/doctors/me", "/appointments", "/pool", "/patient-intake", "/prescriptions"],
  });

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
        setToday((current) =>
          current
            ? {
                ...current,
                appointments: current.appointments.map((item) =>
                  item.id === appointment.id ? response.appointment : item,
                ),
              }
            : current,
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

  const toggleFollowUp = useCallback((appointmentId: number) => {
    setOpenFollowUpIds((current) =>
      current.includes(appointmentId) ? current.filter((id) => id !== appointmentId) : [...current, appointmentId],
    );
  }, []);

  const active = (today?.appointments ?? []).filter(
    (appointment) => appointment.status === "IN_PROGRESS" || appointment.status === "ASSIGNED",
  );

  const counts = today?.counts ?? {
    total: summary?.today?.appointment_count ?? 0,
    assigned: summary?.today?.assigned ?? 0,
    in_progress: summary?.today?.in_progress ?? 0,
    seen_today: summary?.today?.seen_today ?? 0,
  };

  return (
    <DoctorPageShell eyebrow="Today" title="Live queue">
      <DoctorSection
        title={summary?.doctor_name || "Doctor summary"}
        description={summary ? `${summary.clinic_name} · ${summary.email}` : "Live doctor summary and OSCAR shortcut."}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Appointments" value={counts.total ?? 0} detail={formatTodayLabel(summary?.today?.date ?? today?.date)} />
          <StatCard label="Assigned" value={counts.assigned ?? 0} />
          <StatCard label="In progress" value={counts.in_progress ?? 0} />
          <StatCard label="Seen today" value={counts.seen_today ?? 0} />
        </div>

      </DoctorSection>

      <DoctorSection title={`Up next · ${formatTodayLabel(today?.date ?? summary?.today?.date)}`}>
        {loading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Loading your queue…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : active.length > 0 ? (
          <div className="space-y-2.5">
            {active.map((appointment, index) => (
              <QueueRow
                key={appointment.id}
                appointment={appointment}
                highlight={index === 0}
                isStarting={startingAppointmentId === appointment.id}
                followUpOpen={openFollowUpIds.includes(appointment.id)}
                onSeePatient={handleSeePatient}
                onToggleFollowUp={toggleFollowUp}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No patients in your queue</p>
          </div>
        )}
      </DoctorSection>
    </DoctorPageShell>
  );
}
