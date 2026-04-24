"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Building2, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DoctorInviteDetailsResponse } from "@/lib/doctor/types";

export default function DoctorInviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const [invite, setInvite] = useState<DoctorInviteDetailsResponse | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    pin: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "pin" ? e.target.value.replace(/\D/g, "").slice(0, 4) : e.target.value;
      setForm((current) => ({ ...current, [field]: value }));
      setError("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
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

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/v1/doctor-auth/invite-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_token: token,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
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

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-foreground">You&apos;re all set!</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Your doctor account has been created. You can now log in with your email and
            password.
          </p>
          <Button className="w-full" onClick={() => router.push("/doctor/login")}>
            Go to Doctor Login
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
                required
              />
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
                required
              />
            </div>
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
            <Input
              id="confirm_password"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirm_password}
              onChange={set("confirm_password")}
              required
            />
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
        </form>
      </div>
    </div>
  );
}
