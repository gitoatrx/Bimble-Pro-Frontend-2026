"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Clock, TrendingUp, Users, Zap } from "lucide-react";
import { readClinicLoginSession } from "@/lib/clinic/session";
import { useRealtimeRefresh } from "@/lib/realtime";
import {
  fetchClinicAnalyticsAppointments,
  fetchClinicAnalyticsDoctors,
  fetchClinicAnalyticsOverview,
  fetchClinicAnalyticsPatients,
  fetchClinicAnalyticsPool,
} from "@/lib/api/clinic-dashboard";

type MonthBar = { month: string; count: number };
type DoctorStat = { name: string; seen: number; pool: number; avgTime: string };

function firstNumber(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

function firstString(...values: Array<unknown>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function formatMinutes(value: number) {
  return value >= 60 ? `${Math.round(value / 60)} hr` : `${Math.round(value)} min`;
}

function normalizeStatCards(data: Record<string, unknown> | null) {
  const summary = data ?? {};

  return [
    {
      label: "Patients seen",
      value: String(
        firstNumber(
          summary.patients_seen,
          summary.active_patients,
          summary.total_patients,
          summary.patients,
          summary.seen,
          summary.appointments_total,
        ),
      ),
      sub: "Last 30 days",
      Icon: Users,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300",
    },
    {
      label: "Pool appointments claimed",
      value: String(
        firstNumber(summary.pool_claimed, summary.pool_appointments_claimed, summary.claimed, summary.pool),
      ),
      sub: "Last 30 days",
      Icon: Zap,
      color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300",
    },
    {
      label: "Pool pickup rate",
      value:
        firstNumber(summary.pool_pickup_rate, summary.pickup_rate, summary.claim_rate) > 0
          ? `${Math.round(firstNumber(summary.pool_pickup_rate, summary.pickup_rate, summary.claim_rate))}%`
          : "0%",
      sub: "Claimed vs. seen by clinic",
      Icon: TrendingUp,
      color: "text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-300",
    },
    {
      label: "Avg. time to claim",
      value: formatMinutes(firstNumber(summary.avg_time_to_claim_minutes, summary.claim_time_minutes)),
      sub: "From pool open to claim",
      Icon: Clock,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
    },
    {
      label: "Avg. consultation time",
      value: formatMinutes(firstNumber(summary.avg_consultation_minutes, summary.consultation_minutes)),
      sub: "Claim to completion",
      Icon: Activity,
      color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300",
    },
  ];
}

function normalizeMonthlySeries(data: unknown): MonthBar[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const month = firstString(record.month, record.label, record.name, record.period);
      const count = firstNumber(record.count, record.value, record.total);
      return month ? { month, count } : null;
    })
    .filter(Boolean) as MonthBar[];
}

function formatChartLabel(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [, month, day] = value.split("-");
    return `${month}/${day}`;
  }
  return value;
}

function normalizeDoctorStats(data: unknown): DoctorStat[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const name = firstString(record.name, record.doctor_name, record.doctor, record.label);
      if (!name) return null;
      return {
        name,
        seen: firstNumber(record.seen, record.patients, record.completed, record.appointments, record.total),
        pool: firstNumber(record.pool, record.pool_claimed, record.claimed),
        avgTime: formatMinutes(firstNumber(record.avg_time_minutes, record.avg_time_to_claim_minutes, record.avgTimeMinutes)),
      };
    })
    .filter(Boolean) as DoctorStat[];
}

function MonthlyChart({ data }: { data: MonthBar[] }) {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Appointments trend</p>
      </div>
      <div className="grid min-h-40 grid-cols-[repeat(auto-fit,minmax(42px,1fr))] items-end gap-2">
        {data.length > 0 ? (
          data.map(({ month, count }) => {
            const pct = (count / maxCount) * 100;
            return (
              <div key={month} className="flex min-w-0 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-primary">{count}</span>
                <div className="flex h-28 w-full items-end rounded-lg bg-primary/5 px-1">
                  <div
                    className="w-full rounded-t-md bg-primary/70 transition-all"
                    style={{ height: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="truncate text-[10px] text-muted-foreground">{formatChartLabel(month)}</span>
              </div>
            );
          })
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
            No monthly appointment data yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const session = readClinicLoginSession();
  const accessToken = session?.accessToken ?? "";
  const hasSession = Boolean(session?.accessToken);
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null);
  const [monthly, setMonthly] = useState<MonthBar[]>([]);
  const [doctors, setDoctors] = useState<DoctorStat[]>([]);
  const [loading, setLoading] = useState(hasSession);
  const [error, setError] = useState(
    hasSession ? "" : "You are not logged in. Please sign in again.",
  );

  const loadAnalytics = useCallback(async () => {
    if (!hasSession) {
      return;
    }

    setError("");

    const [overviewData, appointmentsData, doctorData, patientsData, poolData] = await Promise.all([
      fetchClinicAnalyticsOverview(accessToken, "30d"),
      fetchClinicAnalyticsAppointments(accessToken, "30d", "day"),
      fetchClinicAnalyticsDoctors(accessToken, "30d"),
      fetchClinicAnalyticsPatients(accessToken, "30d"),
      fetchClinicAnalyticsPool(accessToken, "30d"),
    ]);

    const overviewRecord = overviewData as Record<string, unknown>;
    const appointmentsRecord = appointmentsData as Record<string, unknown>;
    const doctorRecords = doctorData as unknown;
    const patientsRecord = patientsData as Record<string, unknown>;
    const poolRecord = poolData as Record<string, unknown>;
    const appointmentsTotal = firstNumber(overviewRecord.appointments_total);
    const poolClaimed = firstNumber(poolRecord.pool, poolRecord.total, poolRecord.pool_claimed);

    setOverview({
      ...overviewRecord,
      patients_seen:
        overviewRecord.patients_seen ??
        overviewRecord.active_patients ??
        patientsRecord.total_patients ??
        patientsRecord.total ??
        appointmentsTotal,
      pool_claimed:
        overviewRecord.pool_claimed ??
        overviewRecord.pool ??
        poolClaimed,
      pool_pickup_rate:
        overviewRecord.pool_pickup_rate ??
        overviewRecord.pickup_rate ??
        (appointmentsTotal > 0 ? (poolClaimed / appointmentsTotal) * 100 : 0),
    });
    setMonthly(
      normalizeMonthlySeries(
        appointmentsRecord.months ??
          appointmentsRecord.data ??
          appointmentsRecord.series ??
          appointmentsRecord.results,
      ),
    );
    setDoctors(normalizeDoctorStats(doctorRecords));
  }, [accessToken, hasSession]);

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    let active = true;

    const initialTimer = window.setTimeout(() => {
      loadAnalytics()
        .catch((err) => {
          if (!active) return;
          setError(err instanceof Error ? err.message : "Could not load analytics.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(initialTimer);
    };
  }, [hasSession, loadAnalytics]);

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    const refreshTimer = window.setInterval(() => {
      loadAnalytics().catch((err) => {
        setError(err instanceof Error ? err.message : "Could not refresh analytics.");
      });
    }, 30000);

    const handleFocus = () => {
      loadAnalytics().catch((err) => {
        setError(err instanceof Error ? err.message : "Could not refresh analytics.");
      });
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [hasSession, loadAnalytics]);

  useRealtimeRefresh(() => loadAnalytics(), {
    enabled: hasSession,
    paths: ["/appointments", "/pool", "/requests", "/patient-portal", "/clinics/me"],
  });

  const stats = useMemo(() => normalizeStatCards(overview), [overview]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Insights
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days</p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20">
          {error}
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, sub, Icon, color }) => (
          <div key={label} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                {loading ? "..." : value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <MonthlyChart data={monthly} />
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          By doctor
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Doctor
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Patients
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pool
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Avg. time
                </th>
              </tr>
            </thead>
            <tbody>
              {doctors.length > 0 ? (
                doctors.map((row, index) => (
                  <tr
                    key={row.name}
                    className={index < doctors.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="px-5 py-3.5 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{row.seen}</td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{row.pool}</td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground">{row.avgTime}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-5 py-6 text-center text-sm text-muted-foreground" colSpan={4}>
                    No doctor analytics yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
