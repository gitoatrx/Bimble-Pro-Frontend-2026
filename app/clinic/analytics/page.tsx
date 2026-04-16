"use client";

import React from "react";
import {
  Activity,
  BarChart3,
  Clock,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// ── Types & mock data ──────────────────────────────────────────────

type StatCard = {
  label: string;
  value: string;
  sub: string;
  Icon: React.FC<{ className?: string }>;
  color: string;
};

const STATS: StatCard[] = [
  {
    label: "Patients seen",
    value: "248",
    sub: "Last 30 days",
    Icon: Users,
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300",
  },
  {
    label: "Pool appointments claimed",
    value: "84",
    sub: "Last 30 days",
    Icon: Zap,
    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-300",
  },
  {
    label: "Pool pickup rate",
    value: "67%",
    sub: "Claimed vs. seen by clinic",
    Icon: TrendingUp,
    color: "text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-300",
  },
  {
    label: "Avg. time to claim",
    value: "4 min",
    sub: "From pool open to claim",
    Icon: Clock,
    color: "text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300",
  },
  {
    label: "Avg. consultation time",
    value: "18 min",
    sub: "Claim to completion",
    Icon: Activity,
    color: "text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300",
  },
];

// ── Monthly bar chart (pure CSS, no library needed) ────────────────

type MonthBar = { month: string; count: number };

const MONTHLY: MonthBar[] = [
  { month: "Nov", count: 18 },
  { month: "Dec", count: 24 },
  { month: "Jan", count: 31 },
  { month: "Feb", count: 27 },
  { month: "Mar", count: 42 },
  { month: "Apr", count: 38 },
];

const MAX_COUNT = Math.max(...MONTHLY.map((m) => m.count));

function MonthlyChart({ data }: { data: MonthBar[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Appointments per month</p>
      </div>
      <div className="flex items-end gap-2" style={{ height: 120 }}>
        {data.map(({ month, count }) => {
          const pct = (count / MAX_COUNT) * 100;
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
        })}
      </div>
    </div>
  );
}

// ── Doctor breakdown ───────────────────────────────────────────────

type DoctorStat = { name: string; seen: number; pool: number; avgTime: string };

const DOCTOR_STATS: DoctorStat[] = [
  { name: "Dr. Priya Patel",  seen: 112, pool: 38, avgTime: "16 min" },
  { name: "Dr. James Kim",    seen: 89,  pool: 31, avgTime: "20 min" },
  { name: "Dr. Sofia Mendes", seen: 47,  pool: 15, avgTime: "22 min" },
];

// ── Page ───────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Insights
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Last 30 days</p>
      </div>

      {/* Stat grid */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STATS.map(({ label, value, sub, Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tracking-tight text-foreground">
                {value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-foreground">{label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      <div className="mb-8">
        <MonthlyChart data={MONTHLY} />
      </div>

      {/* Doctor breakdown */}
      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          By doctor
        </h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
              {DOCTOR_STATS.map((row, i) => (
                <tr
                  key={row.name}
                  className={i < DOCTOR_STATS.length - 1 ? "border-b border-border" : ""}
                >
                  <td className="px-5 py-3.5 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{row.seen}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-foreground">{row.pool}</td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground">{row.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
