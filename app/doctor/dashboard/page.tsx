"use client";

import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { appointmentLabel } from "@/lib/doctor/types";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import { formatCanadaPacificDateKey } from "@/lib/time-zone";
import { fetchDoctorSummary, fetchDoctorToday, type DoctorAppointment, type DoctorSummary, type DoctorTodayResponse } from "@/lib/api/doctor-dashboard";

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
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

function QueueRow({ appointment, highlight = false }: { appointment: DoctorAppointment; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-3 py-3 sm:flex-row sm:items-center",
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-background",
      )}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {appointment.patient_name.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{appointment.patient_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {appointment.user_friendly_service_name || appointment.service_name}
        </p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {appointment.time}
        </span>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
            STATUS_COLORS[appointment.status] ?? "bg-muted text-muted-foreground",
          )}
        >
          {appointmentLabel(appointment.status)}
        </span>
      </div>
    </div>
  );
}

export default function DoctorDashboardPage() {
  const [summary, setSummary] = useState<DoctorSummary | null>(null);
  const [today, setToday] = useState<DoctorTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const session = readDoctorLoginSession();
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
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadData();
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
    <DoctorPageShell eyebrow="Today" title="Today">
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

        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => { setRefreshing(true); void loadData(); }} disabled={loading || refreshing}>
            <RefreshCw className={cn("h-4 w-4", (loading || refreshing) && "animate-spin")} />
            Refresh
          </Button>
          {summary?.app_url ? (
            <a
              href={summary.app_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-4 w-4" />
              Open OSCAR
            </a>
          ) : null}
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
              <QueueRow key={appointment.id} appointment={appointment} highlight={index === 0} />
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
