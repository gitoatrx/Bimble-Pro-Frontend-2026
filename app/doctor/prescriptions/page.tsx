"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Download, RefreshCw } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { cn } from "@/lib/utils";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import { fetchDoctorPrescriptions, type DoctorPrescription } from "@/lib/api/doctor-dashboard";

function normalizeStatus(status: string | undefined) {
  return status?.toLowerCase() === "completed" ? "completed" : "pending";
}

export default function DoctorPrescriptionsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [prescriptions, setPrescriptions] = useState<DoctorPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPrescriptions = useCallback(async (options: { silent?: boolean } = {}) => {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (options.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetchDoctorPrescriptions(session.accessToken);
      setPrescriptions(response.prescriptions ?? []);
      setError("");
    } catch (err) {
      setPrescriptions([]);
      setError(err instanceof Error ? err.message : "Failed to load prescriptions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPrescriptions();
  }, [loadPrescriptions]);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadPrescriptions({ silent: true });
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadPrescriptions]);

  const visible = useMemo(
    () =>
      prescriptions.filter(
        (prescription) => filter === "all" || normalizeStatus(prescription.status) === filter,
      ),
    [filter, prescriptions],
  );

  return (
    <DoctorPageShell eyebrow="Records" title="Prescriptions">
      <DoctorSection title="Filter">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
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
          <button
            type="button"
            onClick={() => void loadPrescriptions({ silent: true })}
            disabled={loading || refreshing}
            title="Refresh prescriptions"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing ? "animate-spin" : "")} />
          </button>
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
            {visible.map((prescription) => {
              const normalizedStatus = normalizeStatus(prescription.status);
              const downloadUrl = prescription.download_url || prescription.document_url;
              return (
              <div
                key={prescription.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 transition-all hover:border-primary/30 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 gap-4">
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl",
                      normalizedStatus === "completed"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                    )}
                  >
                    {normalizedStatus === "completed" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {prescription.medication || prescription.drug_name || "Prescription"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {prescription.dosage || prescription.instructions || "No dosage instructions provided."}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {prescription.patient_name} · {prescription.written_at_label}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start">
                  {downloadUrl ? (
                    <a
                      href={downloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Download prescription"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  ) : null}
                  <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    {normalizedStatus === "completed" ? "Done" : "In progress"}
                  </div>
                </div>
              </div>
              );
            })}

            {visible.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  {prescriptions.length > 0 ? "No prescriptions match this filter." : "No prescriptions found."}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </DoctorSection>
    </DoctorPageShell>
  );
}
