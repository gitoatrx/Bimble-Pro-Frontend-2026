"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

export default function DoctorInviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
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
          <h1 className="mb-2 text-xl font-bold text-foreground">You're all set!</h1>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-2xl">👨‍⚕️</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Accept clinic invite</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your Bimble doctor account to join the clinic.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="first_name" className="text-sm font-medium text-foreground">First name</label>
              <Input
                id="first_name"
                placeholder="Jane"
                value={form.first_name}
                onChange={set("first_name")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="last_name" className="text-sm font-medium text-foreground">Last name</label>
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
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <Input
              id="password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={set("password")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm_password" className="text-sm font-medium text-foreground">Confirm password</label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirm_password}
              onChange={set("confirm_password")}
              required
            />
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
