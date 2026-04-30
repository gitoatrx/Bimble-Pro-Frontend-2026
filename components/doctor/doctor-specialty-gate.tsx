"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchDoctorSpecialtySelections,
  fetchMspSpecialties,
  saveDoctorSpecialtySelections,
  type MspSpecialtyRecord,
} from "@/lib/api/doctor-dashboard";
import { cn } from "@/lib/utils";

type DoctorSpecialtyGateProps = {
  accessToken: string;
};

export function DoctorSpecialtyGate({ accessToken }: DoctorSpecialtyGateProps) {
  const [catalog, setCatalog] = useState<MspSpecialtyRecord[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSpecialties() {
      setLoading(true);
      setError("");
      try {
        const [catalogResponse, selectionResponse] = await Promise.all([
          fetchMspSpecialties(),
          fetchDoctorSpecialtySelections(accessToken),
        ]);
        if (!active) return;

        const existingCodes = selectionResponse.specialty_codes ?? [];
        setCatalog(catalogResponse);
        setSelectedCodes(existingCodes);
        setShouldPrompt(existingCodes.length === 0);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load specialties.");
        setShouldPrompt(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSpecialties();
    return () => {
      active = false;
    };
  }, [accessToken]);

  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const filteredCatalog = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return catalog;

    return catalog.filter((specialty) =>
      [
        specialty.code,
        specialty.name,
        specialty.category,
        specialty.description,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [catalog, searchQuery]);

  function toggleSpecialty(code: string) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    );
  }

  async function saveSpecialties() {
    if (selectedCodes.length === 0) return;

    setSaving(true);
    setError("");
    try {
      await saveDoctorSpecialtySelections(accessToken, selectedCodes);
      setShouldPrompt(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save specialties.");
    } finally {
      setSaving(false);
    }
  }

  if (!shouldPrompt) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="doctor-specialty-title"
        className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Stethoscope className="h-5 w-5" />
            </span>
            <div>
              <h2 id="doctor-specialty-title" className="text-lg font-semibold text-foreground">
                Select your specialties
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose one or more MSP specialties you can handle before entering your dashboard.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <label className="relative block">
            <span className="sr-only">Search specialties</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search specialties by name or code"
              className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
        </div>

        <div className="max-h-[48vh] overflow-auto p-5">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">Loading specialties...</p>
            </div>
          ) : filteredCatalog.length > 0 ? (
            <div className="space-y-2">
              {filteredCatalog.map((specialty) => {
                const selected = selectedSet.has(specialty.code);
                return (
                  <button
                    key={specialty.code}
                    type="button"
                    onClick={() => toggleSpecialty(specialty.code)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                      )}
                      aria-hidden="true"
                    >
                      {selected ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {specialty.code} - {specialty.name}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {specialty.description || specialty.category}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
              <p className="text-sm font-medium text-foreground">
                {catalog.length === 0 ? "No specialties are available right now." : "No specialties match your search."}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5">
            {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
          </div>
          <Button
            onClick={saveSpecialties}
            disabled={loading || saving || selectedCodes.length === 0}
            className="sm:min-w-40"
          >
            {saving ? "Saving..." : "Save and continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
