"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { DoctorPageShell, DoctorSection } from "@/components/doctor/doctor-page-shell";
import { DoctorHlth2820Editor } from "@/components/doctor/doctor-hlth2820-editor";
import { DoctorDuplicatePrescriptionPadOrderEditor } from "@/components/doctor/doctor-duplicate-prescription-pad-order-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { readDoctorLoginSession } from "@/lib/doctor/session";
import {
  fetchDoctorProfile,
  updateDoctorPassword,
  updateDoctorProfile,
} from "@/lib/api/doctor-dashboard";

function SaveButton({ onSave, label = "Save changes" }: { onSave: () => Promise<void>; label?: string }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handle() {
    setSaving(true);
    await onSave();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Button onClick={handle} disabled={saving} size="sm" className="gap-2">
      {saved ? (
        <>
          <Check className="h-3.5 w-3.5" /> Saved
        </>
      ) : saving ? (
        "Saving…"
      ) : (
        label
      )}
    </Button>
  );
}

export default function DoctorSettingsPage() {
  const router = useRouter();
  const [profileDraft, setProfileDraft] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [credentials, setCredentials] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [showFormsHub, setShowFormsHub] = useState(false);
  const [showHlth2820Modal, setShowHlth2820Modal] = useState(false);
  const [showPrescriptionPadOrderModal, setShowPrescriptionPadOrderModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showHlth2820Modal && !showPrescriptionPadOrderModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowHlth2820Modal(false);
        setShowPrescriptionPadOrderModal(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showHlth2820Modal, showPrescriptionPadOrderModal]);

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
        const profileResponse = await fetchDoctorProfile(session.accessToken);
        if (!cancelled) {
          setProfileDraft({
            first_name: profileResponse.first_name ?? "",
            last_name: profileResponse.last_name ?? "",
            email: profileResponse.email ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load settings.");
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

  async function handleProfileSave() {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      return;
    }
    await updateDoctorProfile(session.accessToken, profileDraft);
  }

  async function handlePasswordSave() {
    const session = readDoctorLoginSession();
    if (!session?.accessToken) {
      setError("You are not logged in.");
      return;
    }
    await updateDoctorPassword(session.accessToken, {
      current_password: credentials.currentPassword,
      new_password: credentials.newPassword,
    });
    setCredentials({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  }

  return (
    <DoctorPageShell eyebrow="Account" title="Settings">
      <div className="grid gap-6">
        <DoctorSection title="Profile">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading profile…</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  placeholder="First name"
                  value={profileDraft.first_name}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, first_name: event.target.value }))}
                />
                <Input
                  placeholder="Last name"
                  value={profileDraft.last_name}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, last_name: event.target.value }))}
                />
              </div>
              <Input
                type="email"
                placeholder="Email address"
                value={profileDraft.email}
                onChange={(event) => setProfileDraft((current) => ({ ...current, email: event.target.value }))}
              />
              <SaveButton onSave={handleProfileSave} />
            </div>
          )}
        </DoctorSection>

        <DoctorSection title="Password">
          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Current password"
                value={credentials.currentPassword}
                onChange={(event) => setCredentials((current) => ({ ...current, currentPassword: event.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPw((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Input
              type="password"
              placeholder="New password"
              value={credentials.newPassword}
              onChange={(event) => setCredentials((current) => ({ ...current, newPassword: event.target.value }))}
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={credentials.confirmPassword}
              onChange={(event) => setCredentials((current) => ({ ...current, confirmPassword: event.target.value }))}
            />
            <SaveButton onSave={handlePasswordSave} label="Update password" />
          </div>
        </DoctorSection>

        <DoctorSection title="Onboarding forms">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Review clinic prefilled forms or complete optional forms when needed
              </p>
              <Button
                type="button"
                variant={showFormsHub ? "outline" : "default"}
                size="sm"
                className="gap-2"
                onClick={() => setShowFormsHub((value) => !value)}
              >
                {showFormsHub ? (
                  <>
                    Hide forms
                    <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Open forms
                    <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {showFormsHub ? (
              <div className="grid gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="!flex h-auto !w-full !justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => router.push("/doctor/onboarding?stage=hlth_2870&optional=1")}
                >
                  <span className="flex flex-1 flex-col items-start space-y-1 text-left">
                    <span className="block font-medium text-foreground">HLTH 2870</span>
                    <span className="block text-xs text-muted-foreground">
                      Assignment of payment due to practitioner under the Medical Services Plan
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-foreground">Open</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="!flex h-auto !w-full !justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => router.push("/doctor/onboarding?stage=hlth_2832&optional=1")}
                >
                  <span className="flex flex-1 flex-col items-start space-y-1 text-left">
                    <span className="block font-medium text-foreground">HLTH 2832</span>
                    <span className="block text-xs text-muted-foreground">
                      Application for direct bank payment from Medical Services Plan (MSP) or request for change of
                      banking information
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-foreground">Open</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="!flex h-auto !w-full !justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => router.push("/doctor/onboarding?stage=hlth_2950&optional=1")}
                >
                  <span className="flex flex-1 flex-col items-start space-y-1 text-left">
                    <span className="block font-medium text-foreground">HLTH 2950</span>
                    <span className="block text-xs text-muted-foreground">
                      Medical Services Plan (MSP) practitioner attachment to MSP facility number for business cost
                      premium
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-foreground">Open</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="!flex h-auto !w-full !justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => setShowHlth2820Modal(true)}
                >
                  <span className="flex flex-1 flex-col items-start space-y-1 text-left">
                    <span className="block font-medium text-foreground">HLTH 2820</span>
                    <span className="block text-xs text-muted-foreground">Application for Teleplan service</span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-foreground">Open</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="!flex h-auto !w-full !justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => router.push("/doctor/onboarding?stage=hlth_2991&optional=1")}
                >
                  <span className="flex flex-1 flex-col items-start space-y-1 text-left">
                    <span className="block font-medium text-foreground">HLTH 2991</span>
                    <span className="block text-xs text-muted-foreground">
                      Application for MSP billing number (physicians)
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-foreground">Open</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="!flex h-auto !w-full !justify-between gap-4 px-4 py-4 text-left"
                  onClick={() => setShowPrescriptionPadOrderModal(true)}
                >
                  <span className="flex flex-1 flex-col items-start space-y-1 text-left">
                    <span className="block font-medium text-foreground">Duplicate Prescription Pad Order Form</span>
                    <span className="block text-xs text-muted-foreground">Duplicate Prescription Pad Order</span>
                  </span>
                  <span className="shrink-0 text-sm font-medium text-foreground">Open</span>
                </Button>
              </div>
            ) : null}
          </div>
        </DoctorSection>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      {showHlth2820Modal ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 py-8 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowHlth2820Modal(false);
            }
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  HLTH 2820
                </p>
                <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  Teleplan form
                </h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowHlth2820Modal(false)}>
                Close
              </Button>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 py-4 sm:px-5">
              <DoctorHlth2820Editor />
            </div>
          </div>
        </div>
      ) : null}

      {showPrescriptionPadOrderModal ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/55 p-4 py-8 sm:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowPrescriptionPadOrderModal(false);
            }
          }}
        >
          <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div className="space-y-1">
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-foreground">
                  Duplicate prescription pad order
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPrescriptionPadOrderModal(false)}
              >
                Close
              </Button>
            </div>
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto px-4 pb-4 pt-2 sm:px-5 sm:pb-5 sm:pt-2">
              <DoctorDuplicatePrescriptionPadOrderEditor />
            </div>
          </div>
        </div>
      ) : null}
    </DoctorPageShell>
  );
}
