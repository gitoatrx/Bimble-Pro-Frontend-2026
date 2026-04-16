"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type Prescription = {
  id: number;
  patientName: string;
  medication: string;
  dosage: string;
  writtenAt: string;
  status: "completed" | "pending";
};

const MOCK: Prescription[] = [
  { id: 1, patientName: "Sarah Chen",   medication: "Amoxicillin",     dosage: "500mg 3x/day × 7 days", writtenAt: "Apr 14, 2026", status: "completed" },
  { id: 2, patientName: "Marcus Brown", medication: "Metformin",        dosage: "500mg 2x/day",          writtenAt: "Apr 10, 2026", status: "completed" },
  { id: 3, patientName: "Rita Nguyen",  medication: "Omeprazole",       dosage: "20mg 1x/day",           writtenAt: "In progress",  status: "pending"   },
  { id: 4, patientName: "Aisha Patel",  medication: "Sertraline",       dosage: "50mg 1x/day",           writtenAt: "Apr 9, 2026",  status: "completed" },
];

export default function DoctorPrescriptionsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const visible = MOCK.filter((p) => filter === "all" || p.status === filter);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Records</p>
        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-foreground">Prescriptions</h1>
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        {(["all", "pending", "completed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("rounded-xl border px-3 py-1.5 text-sm font-medium capitalize transition-all",
              filter === f ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/30")}>
            {f === "all" ? "All" : f === "pending" ? "In progress" : "Completed"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {visible.map((rx) => (
          <div key={rx.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:bg-accent/30 transition-colors">
            <div className="mt-0.5 flex-shrink-0">
              {rx.status === "completed"
                ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                : <Clock className="h-4 w-4 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{rx.medication}</p>
              <p className="text-xs text-muted-foreground">{rx.dosage}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {rx.patientName} · {rx.writtenAt}
              </p>
            </div>
            <span className={cn("text-xs font-medium flex-shrink-0",
              rx.status === "completed" ? "text-green-600" : "text-amber-600")}>
              {rx.status === "completed" ? "Done" : "In progress"}
            </span>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No prescriptions found.</p>
        )}
      </div>
    </div>
  );
}
