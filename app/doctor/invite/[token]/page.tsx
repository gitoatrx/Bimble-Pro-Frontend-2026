"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DoctorInviteDetailsResponse, DoctorRejectInviteResponse } from "@/lib/doctor/types";
import { getLiveAlphabeticError, normalizeNameInput } from "@/lib/form-validation";

const invalidInputClassName = "!border-destructive focus-visible:ring-destructive/20";

type InviteForm = {
  first_name: string;
  last_name: string;
  college_id: string;
  msp_billing_number: string;
  password: string;
  confirm_password: string;
  pin: string;
};

type InviteFormErrors = Partial<Record<keyof Pick<InviteForm, "first_name" | "last_name">, string>>;

export default function DoctorInviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = typeof params.token === "string" ? params.token : "";
  const wantsReject = searchParams.get("decision") === "reject";

  const [invite, setInvite] = useState<DoctorInviteDetailsResponse | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [form, setForm] = useState<InviteForm>({
    first_name: "",
    last_name: "",
    college_id: "",
    msp_billing_number: "",
    password: "",
    confirm_password: "",
    pin: "",
  });
  const [fieldErrors, setFieldErrors] = useState<InviteFormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInvite() {
      if (!token) {
        if (active) {
          setError("Invite token is missing.");
          setLoadingInvite(false);
        }
        return;
      }

      try {
        const response = await fetch(`/api/v1/doctor-auth/invite/${token}`, {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json().catch(() => ({}))) as
          | DoctorInviteDetailsResponse
          | { message?: string };
        if (!response.ok) {
          const message =
            "message" in data && typeof data.message === "string"
              ? data.message
              : "Failed to load invite.";
          throw new Error(message);
        }
        if (!active) return;
        setInvite(data as DoctorInviteDetailsResponse);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load invite.");
        }
      } finally {
        if (active) {
          setLoadingInvite(false);
        }
      }
    }

    void loadInvite();
    return () => {
      active = false;
    };
  }, [token]);

  function set(field: keyof InviteForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const value =
        field === "pin"
          ? rawValue.replace(/\D/g, "").slice(0, 4)
          : field === "first_name" || field === "last_name"
            ? normalizeNameInput(rawValue)
            : rawValue;

      setForm((current) => ({ ...current, [field]: value }));
      if (field === "first_name" || field === "last_name") {
        setFieldErrors((current) => ({
          ...current,
          [field]: getLiveAlphabeticError(value, field === "first_name" ? "first name" : "last name"),
        }));
      }
      setError("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const normalizedFirstName = normalizeNameInput(form.first_name).trim();
    const normalizedLastName = normalizeNameInput(form.last_name).trim();
    const nextFieldErrors: InviteFormErrors = {
      first_name: normalizedFirstName
        ? getLiveAlphabeticError(normalizedFirstName, "first name")
        : "First name is required.",
      last_name: normalizedLastName
        ? getLiveAlphabeticError(normalizedLastName, "last name")
        : "Last name is required.",
    };
    const hasFieldErrors = Object.values(nextFieldErrors).some(Boolean);

    setForm((current) => ({
      ...current,
      first_name: normalizedFirstName,
      last_name: normalizedLastName,
    }));
    setFieldErrors(nextFieldErrors);

    if (hasFieldErrors) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    if (!/^\d{4}$/.test(form.pin.trim())) {
      setError("PIN must be 4 digits.");
      return;
    }

    const collegeId = form.college_id.trim();
    if (!collegeId) {
      setError("CPSID / College ID / Prescriber ID is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/v1/doctor-auth/invite-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_token: token,
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          college_id: collegeId,
          msp_billing_number: form.msp_billing_number.trim() || undefined,
          password: form.password,
          pin: form.pin.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          (data as { message?: string }).message ||
            "Failed to accept invite. The link may have expired.",
        );
        return;
      }

      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRejectInvite() {
    if (!token) return;
    setRejecting(true);
    setError("");

    try {
      const res = await fetch("/api/v1/doctor-auth/invite-reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_token: token }),
      });

      const data = (await res.json().catch(() => ({}))) as
        | DoctorRejectInviteResponse
        | { message?: string };

      if (!res.ok) {
        setError(
          (data as { message?: string }).message ||
            "Failed to reject invite. The link may have expired.",
        );
        return;
      }

      setRejectMessage(
        (data as DoctorRejectInviteResponse).message || "You rejected this clinic invite.",
      );
      setRejected(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setRejecting(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">You&apos;re all set!</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Your doctor account has been created. Log in now to review and submit the
            HLTH 2870 and HLTH 2950 forms sent by the clinic.
          </p>
          <Button
            className="w-full"
            onClick={() =>
              router.push(`/doctor/login?next=${encodeURIComponent("/doctor/onboarding?stage=hlth_2870")}`)
            }
          >
            Log in and open forms
          </Button>
        </div>
      </div>
    );
  }

  if (rejected || invite?.status === "REJECTED") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
            <XCircle className="h-7 w-7 text-rose-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">Invite rejected</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            {rejectMessage || `You have rejected the invite from ${invite?.clinic_name || "this clinic"}.`}
          </p>
          <Button variant="outline" className="w-full" onClick={() => router.push("/doctor/login")}>
            Back to Doctor Login
          </Button>
        </div>
      </div>
    );
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading invite…
        </div>
      </div>
    );
  }

  if (wantsReject && invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100">
              <XCircle className="h-6 w-6 text-rose-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Reject clinic invite?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This will let {invite.clinic_name} know that you rejected their invitation.
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" onClick={() => router.push(`/doctor/invite/${token}`)}>
              Go back
            </Button>
            <Button
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={handleRejectInvite}
              disabled={rejecting}
            >
              {rejecting ? "Rejecting..." : "Reject invite"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (invite?.existing_doctor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Join {invite.clinic_name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              This invite belongs to an existing doctor account for {invite.email}. Sign in to join this clinic.
            </p>
          </div>

          {invite.already_member ? (
            <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              You are already a member of this clinic. You can sign in and select it from your clinic list.
            </div>
          ) : null}

          {error && (
            <p className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="w-full"
            onClick={() => router.push(`/doctor/login?invite_token=${encodeURIComponent(token)}`)}
          >
            Continue to Doctor Login
          </Button>
          {!invite.already_member ? (
            <Button
              variant="outline"
              className="mt-3 w-full border-rose-200 text-rose-700 hover:bg-rose-50"
              onClick={handleRejectInvite}
              disabled={rejecting}
            >
              {rejecting ? "Rejecting invite..." : "Reject invite"}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Accept clinic invite</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your Bimble doctor account to join {invite?.clinic_name || "the clinic"}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="first_name" className="text-sm font-medium text-foreground">
                First name
              </label>
              <Input
                id="first_name"
                placeholder="Jane"
                value={form.first_name}
                onChange={set("first_name")}
                aria-invalid={Boolean(fieldErrors.first_name)}
                className={fieldErrors.first_name ? invalidInputClassName : undefined}
                required
              />
              {fieldErrors.first_name ? (
                <p className="text-xs text-destructive">{fieldErrors.first_name}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="last_name" className="text-sm font-medium text-foreground">
                Last name
              </label>
              <Input
                id="last_name"
                placeholder="Smith"
                value={form.last_name}
                onChange={set("last_name")}
                aria-invalid={Boolean(fieldErrors.last_name)}
                className={fieldErrors.last_name ? invalidInputClassName : undefined}
                required
              />
              {fieldErrors.last_name ? (
                <p className="text-xs text-destructive">{fieldErrors.last_name}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="college_id" className="text-sm font-medium text-foreground">
              CPSID / College ID / Prescriber ID
            </label>
            <Input
              id="college_id"
              placeholder="Required for prescriptions"
              value={form.college_id}
              onChange={set("college_id")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="msp_billing_number" className="text-sm font-medium text-foreground">
              MSP billing / provider number
            </label>
            <Input
              id="msp_billing_number"
              placeholder="Optional, used for billing"
              value={form.msp_billing_number}
              onChange={set("msp_billing_number")}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={set("password")}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="confirm_password"
              className="text-sm font-medium text-foreground"
            >
              Confirm password
            </label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirm_password}
                onChange={set("confirm_password")}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="pin" className="text-sm font-medium text-foreground">
              PIN
            </label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                placeholder="4-digit PIN"
                value={form.pin}
                onChange={set("pin")}
                maxLength={4}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Setting up account…" : "Accept invite & create account"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={handleRejectInvite}
            disabled={rejecting || submitting}
          >
            {rejecting ? "Rejecting invite..." : "Reject invite"}
          </Button>
        </form>
      </div>
    </div>
  );
}
