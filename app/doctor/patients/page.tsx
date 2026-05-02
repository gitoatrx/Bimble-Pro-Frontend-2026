"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { Input } from "@/components/ui/input";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import { fetchDoctorPatients, type DoctorPatient } from "@/lib/api/doctor-dashboard";
import { useRealtimeRefresh } from "@/lib/realtime";

function formatAgeFromDob(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function firstText(...values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function formatGender(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatPatientSummary(patient: DoctorPatient): string {
  const parts: string[] = [];
  const age = formatAgeFromDob(patient.dob) ?? patient.patient_age ?? patient.age ?? null;
  const gender = formatGender(firstText(patient.patient_gender, patient.gender));
  const phn = firstText(patient.phn, patient.health_number, patient.medical_record_number);

  if (age !== null) parts.push(`Age ${age}`);
  if (gender) parts.push(`Gender ${gender}`);
  if (phn) parts.push(`PHN ${phn}`);
  if (patient.total_visits > 0) {
    parts.push(`${patient.total_visits} visit${patient.total_visits !== 1 ? "s" : ""}`);
  }

  return parts.join(" · ");
}

export default function DoctorPatientsPage() {
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  const loadPatients = useCallback(async () => {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetchDoctorPatients(session.accessToken, debouncedQuery);
      setPatients(response.patients ?? []);
    } catch (err) {
      setPatients([]);
      setError(err instanceof Error ? err.message : "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPatients();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPatients]);

  useRealtimeRefresh(loadPatients, {
    paths: ["/appointments", "/patients", "/patient"],
  });

  return (
    <DoctorPageShell eyebrow="Records" title="Patients">
      <DoctorSection title="Search">
        <div className="relative mb-4 w-full max-w-sm">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-11"
          />
        </div>

        {loading ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">Loading patients…</p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-dashed border-destructive/40 bg-destructive/5 px-5 py-10 text-center">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 transition-all hover:border-primary/30 sm:flex-row sm:items-center"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xs font-semibold text-primary">
                  {patient.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{patient.name}</p>
                    <span
                      className={
                        patient.status === "inactive"
                          ? "rounded-full border border-border/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                          : "rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300"
                      }
                    >
                      {patient.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatPatientSummary(patient)}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background px-3 py-2.5 text-left sm:min-w-[160px] sm:text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Last seen
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{patient.last_seen_label}</p>
                </div>
              </div>
            ))}
            {patients.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-muted/30 px-5 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No patients match your search.</p>
              </div>
            ) : null}
          </div>
        )}
      </DoctorSection>
    </DoctorPageShell>
  );
}
