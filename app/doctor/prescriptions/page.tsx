"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { cn } from "@/lib/utils";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import { fetchDoctorPrescriptions, type DoctorPrescription } from "@/lib/api/doctor-dashboard";

export default function DoctorPrescriptionsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const session = readDoctorLoginSession();
      if (!session?.accessToken) {
        setError("You are not logged in.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetchDoctorPrescriptions(session.accessToken);
        if (!cancelled) {
          setPrescriptions(response.prescriptions ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setPrescriptions([]);
          setError(err instanceof Error ? err.message : "Failed to load prescriptions.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(
    () => prescriptions.filter((prescription) => filter === "all" || prescription.status === filter),
    [filter, prescriptions],
  );

  return (
    <DoctorPageShell eyebrow="Records" title="Prescriptions">
      <DoctorSection title="Filter">
        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "pending", "completed"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                filter === option
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {option === "all" ? "All" : option === "pending" ? "In progress" : "Completed"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Loading prescriptions…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map((prescription) => (
              <div
                key={prescription.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 transition-all hover:border-primary/30 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl",
                      prescription.status === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                    )}
                  >
                    {prescription.status === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{prescription.medication}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{prescription.dosage}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {prescription.patient_name} · {prescription.written_at_label}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {prescription.status === "completed" ? "Done" : "In progress"}
                </div>
              </div>
            ))}

            {visible.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No prescriptions found.</p>
              </div>
            ) : null}
          </div>
        )}
      </DoctorSection>
    </DoctorPageShell>
  );
}
