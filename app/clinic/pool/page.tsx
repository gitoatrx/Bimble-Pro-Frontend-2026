"use client";

import React, { useState } from "react";
import { ArrowRight, CircleUserRound, MessageSquareText, MonitorSmartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PoolAppointment = {
  id: number;
  patientName: string;
  reason: string;
  appointmentType: "walkin" | "virtual";
};

const MOCK_POOL: PoolAppointment[] = [
  {
    id: 101,
    patientName: "Ava Chen",
    reason: "General consultation",
    appointmentType: "walkin",
  },
  {
    id: 102,
    patientName: "Noah Patel",
    reason: "Prescription renewal",
    appointmentType: "virtual",
  },
  {
    id: 103,
    patientName: "Mia Gonzalez",
    reason: "Mental health follow-up",
    appointmentType: "virtual",
  },
  {
    id: 104,
    patientName: "Ethan Brooks",
    reason: "Sick note request",
    appointmentType: "walkin",
  },
];

function AppointmentTypeBadge({ type }: { type: PoolAppointment["appointmentType"] }) {
  const isVirtual = type === "virtual";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        isVirtual
          ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
      )}
    >
      {isVirtual ? <MonitorSmartphone className="h-2.5 w-2.5" /> : <CircleUserRound className="h-2.5 w-2.5" />}
      {type}
    </span>
  );
}

export default function ClinicPoolPage() {
  const [pool, setPool] = useState<PoolAppointment[]>(MOCK_POOL);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimed, setClaimed] = useState<number[]>([]);

  async function handleClaim(id: number) {
    setClaiming(id);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setClaiming(null);
    setClaimed((current) => [...current, id]);
    setPool((current) => current.filter((appt) => appt.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Clinic pool
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Available Appointments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pool.length} appointment{pool.length !== 1 ? "s" : ""} available · First to assign wins
        </p>
      </div>

      {pool.length === 0 && claimed.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <Zap className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Pool is empty right now</p>
          <p className="mt-1 text-xs text-muted-foreground">
            New appointments will appear here automatically.
          </p>
        </div>
      )}

      {claimed.length > 0 && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300">
          You assigned {claimed.length} appointment{claimed.length > 1 ? "s" : ""} this session. Check today&apos;s appointments to follow up.
        </div>
      )}

      <div className="space-y-3">
        {pool.map((appt) => (
          <div
            key={appt.id}
            className="rounded-2xl border border-border bg-card px-5 py-4 transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{appt.patientName}</p>
                  <AppointmentTypeBadge type={appt.appointmentType} />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquareText className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{appt.reason}</span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleClaim(appt.id)}
                disabled={claiming !== null}
                className="shrink-0"
              >
                {claiming === appt.id ? "Assigning…" : "Assign"}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
