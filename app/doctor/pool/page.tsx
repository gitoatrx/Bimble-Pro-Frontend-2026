"use client";

import React, { useState } from "react";
import { Clock, MapPin, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PoolAppointment = {
  id: number;
  service: string;
  city: string;
  postedAt: string;
  visibility: "PREMIUM_VISIBLE" | "OPEN";
  urgency: "routine" | "urgent";
};

const MOCK_POOL: PoolAppointment[] = [
  { id: 101, service: "General Consultation", city: "Vancouver", postedAt: "2 min ago", visibility: "PREMIUM_VISIBLE", urgency: "routine" },
  { id: 102, service: "Prescription Renewal",  city: "Burnaby",   postedAt: "5 min ago", visibility: "OPEN",             urgency: "routine" },
  { id: 103, service: "Mental Health Assessment", city: "Richmond", postedAt: "8 min ago", visibility: "OPEN",           urgency: "urgent"  },
  { id: 104, service: "Sick Note",              city: "Surrey",    postedAt: "12 min ago",visibility: "OPEN",             urgency: "routine" },
];

export default function DoctorPoolPage() {
  const [pool, setPool] = useState<PoolAppointment[]>(MOCK_POOL);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [claimed, setClaimed] = useState<number[]>([]);

  async function handleClaim(id: number) {
    setClaiming(id);
    await new Promise((r) => setTimeout(r, 800)); // POST /api/v1/appointments/{id}/pickup
    setClaiming(null);
    setClaimed((c) => [...c, id]);
    setPool((p) => p.filter((a) => a.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Central pool
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">
          Available Appointments
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pool.length} appointment{pool.length !== 1 ? "s" : ""} available · First to claim wins
        </p>
      </div>

      {pool.length === 0 && claimed.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 text-center">
          <Zap className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Pool is empty right now</p>
          <p className="mt-1 text-xs text-muted-foreground">New appointments will appear here automatically.</p>
        </div>
      )}

      {claimed.length > 0 && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/20 dark:text-green-300">
          You claimed {claimed.length} appointment{claimed.length > 1 ? "s" : ""} this session. Check your queue on the Today tab.
        </div>
      )}

      <div className="space-y-3">
        {pool.map((appt) => (
          <div
            key={appt.id}
            className={cn(
              "rounded-2xl border bg-card px-5 py-4 transition-all",
              appt.visibility === "PREMIUM_VISIBLE"
                ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800"
                : "border-border",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">{appt.service}</p>
                  {appt.urgency === "urgent" && (
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                      Urgent
                    </span>
                  )}
                  {appt.visibility === "PREMIUM_VISIBLE" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      <Zap className="h-2.5 w-2.5" /> Early access
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{appt.city}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{appt.postedAt}</span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => handleClaim(appt.id)}
                disabled={claiming !== null}
                className="shrink-0"
              >
                {claiming === appt.id ? "Claiming…" : "Claim"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
