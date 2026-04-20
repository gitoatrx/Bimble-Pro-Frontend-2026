"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  FeeScheduleServiceRecord,
  searchFeeScheduleServicesPublic,
} from "@/lib/api/clinic-dashboard";

type ServicePickerProps = {
  value: FeeScheduleServiceRecord[];
  onChange: (services: FeeScheduleServiceRecord[]) => void;
};

function ServicePickerField({ value, onChange }: ServicePickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeeScheduleServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onDocumentClick(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const trimmed = query.trim();

    if (!open) {
      return;
    }

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    const timer = window.setTimeout(async () => {
      try {
        const items = await searchFeeScheduleServicesPublic(trimmed);
        if (cancelled) {
          return;
        }
        setResults(items);
      } catch {
        if (!cancelled) {
          setResults([]);
          setError("Could not load services right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  function toggleService(service: FeeScheduleServiceRecord) {
    const exists = value.some((item) => item.service_code === service.service_code);
    const next = exists
      ? value.filter((item) => item.service_code !== service.service_code)
      : [...value, service];

    onChange(next);
  }

  return (
    <div ref={rootRef} className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-foreground">Services</label>
        <span className="text-xs text-muted-foreground">{value.length} selected</span>
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-sm">
        <div className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors",
          open ? "ring-2 ring-primary/20" : "hover:bg-muted/40",
        )}>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Select services..."
            className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
          <ChevronDown
            onClick={() => setOpen((current) => !current)}
            className={`h-4 w-4 flex-shrink-0 cursor-pointer text-muted-foreground transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>

        {value.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            {value.map((service) => (
              <span
                key={service.service_code}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
              >
                {service.user_friendly_service_name || service.service_name}
                <button
                  type="button"
                  onClick={() => toggleService(service)}
                  className="rounded-full p-0.5 transition-colors hover:bg-primary/10"
                  aria-label={`Remove ${service.service_name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {open && query.trim().length >= 2 && (
          <div className="p-3">
            <div className="mt-1 max-h-64 space-y-1 overflow-auto">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading services...
                </div>
              )}

              {!loading && error && (
                <p className="px-3 py-2 text-sm text-destructive">{error}</p>
              )}

              {!loading && !error && query.trim().length >= 2 && results.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">No matching services found.</p>
              )}

              {!loading &&
                !error &&
                results.map((service) => {
                  const checked = value.some(
                    (item) => item.service_code === service.service_code,
                  );

                  return (
                    <button
                      key={service.service_code}
                      type="button"
                      onClick={() => toggleService(service)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                        checked
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded border ${
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background"
                        }`}
                      >
                        {checked && <CheckCircle2 className="h-3 w-3" />}
                      </span>

                      <span className="flex-1">
                        <span className="block text-sm font-medium text-foreground">
                          {service.user_friendly_service_name || service.service_name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {service.service_code}
                          {service.price ? ` • $${service.price}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoctorInviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
    pin: "",
  });
  const [services, setServices] = useState<FeeScheduleServiceRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

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
          service_codes: services.map((service) => service.service_code),
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
            <Input
              id="pin"
              inputMode="numeric"
              placeholder="4-digit PIN"
              value={form.pin}
              onChange={set("pin")}
              maxLength={4}
              required
            />
          </div>

          <ServicePickerField value={services} onChange={setServices} />

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
