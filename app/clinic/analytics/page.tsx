"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Clock, TrendingUp, Users, Zap } from "lucide-react";
import { readClinicLoginSession } from "@/lib/clinic/session";
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
        firstNumber(summary.patients_seen, summary.patients, summary.seen, summary.total_patients),
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
        seen: firstNumber(record.seen, record.patients, record.total),
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
        <p className="text-sm font-semibold text-foreground">Appointments per month</p>
      </div>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {data.length > 0 ? (
          data.map(({ month, count }) => {
            const pct = (count / maxCount) * 100;
            return (
              <div key={month} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-primary">{count}</span>
                <div
                  className="w-full rounded-t-md bg-primary/60 transition-all"
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{month}</span>
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

  useEffect(() => {
    if (!hasSession) {
      return;
    }

    let active = true;

    Promise.all([
      fetchClinicAnalyticsOverview(accessToken, "30d"),
      fetchClinicAnalyticsAppointments(accessToken, "30d", "month"),
      fetchClinicAnalyticsDoctors(accessToken, "30d"),
      fetchClinicAnalyticsPatients(accessToken, "30d"),
      fetchClinicAnalyticsPool(accessToken, "30d"),
    ])
      .then(([overviewData, appointmentsData, doctorData, patientsData, poolData]) => {
        if (!active) return;

        const overviewRecord = overviewData as Record<string, unknown>;
        const appointmentsRecord = appointmentsData as Record<string, unknown>;
        const doctorRecords = doctorData as unknown;
        const patientsRecord = patientsData as Record<string, unknown>;
        const poolRecord = poolData as Record<string, unknown>;

        setOverview({
          ...overviewRecord,
          patients_seen:
            overviewRecord.patients_seen ??
            patientsRecord.total ??
            patientsRecord.patients_seen,
          pool:
            overviewRecord.pool ??
            poolRecord.total ??
            poolRecord.pool_claimed,
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
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load analytics.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, hasSession]);

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
