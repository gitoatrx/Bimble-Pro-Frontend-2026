"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  XCircle,
} from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { Button } from "@/components/ui/button";

export default function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const isSuccess = searchParams.get("success") === "1";
  const isCancelled = searchParams.get("cancelled") === "1";
  const clinicCode = searchParams.get("clinic_code") ?? searchParams.get("clinicCode");
  const clinicId = searchParams.get("clinic_id") ?? searchParams.get("clinicId");

  // Redirect bare /onboarding/billing with no status param back to signup
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!isSuccess && !isCancelled) {
      router.replace("/onboarding");
    } else {
      setReady(true);
    }
  }, [isSuccess, isCancelled, router]);

  if (!ready) {
    return null;
  }

  /* ── Payment cancelled ─────────────────────────────────────────────────── */
  if (isCancelled) {
    return (
      <ClinicFlowShell backHref="/onboarding" backLabel="Back to signup">
        <div className="mx-auto max-w-2xl space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-destructive">
                Payment not completed
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Your clinic is on hold
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                You cancelled before completing payment. Your clinic registration
                has been saved — come back any time to complete the payment and
                start provisioning.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/onboarding")}
            >
              Try again
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 sm:min-w-40"
              onClick={() => router.push("/")}
            >
              Back to home
            </Button>
          </div>
        </div>
      </ClinicFlowShell>
    );
  }

  /* ── Payment successful ─────────────────────────────────────────────────── */
  return (
    <ClinicFlowShell backHref="/" backLabel="Back to home">
      <div className="mx-auto max-w-2xl space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Registration received
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your clinic login is pending approval
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Thank you for registering. Our team will review and activate your
              clinic. Once approved, you will receive your login credentials by
              email.
            </p>
          </div>
        </div>

        {/* What happens next */}
        <div className="rounded-2xl border border-border bg-slate-50 p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            What happens next
          </div>

          <ol className="space-y-3 text-sm text-muted-foreground list-none pl-0">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                1
              </span>
              <span>
                Your clinic is in the setup queue. We will configure your
                database, EMR, and admin account in the background — no action
                needed from you right now.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                2
              </span>
              <span>
                <strong className="text-foreground">
                  Once approved and ready
                </strong>
                , you will receive an email with your admin login credentials
                and a direct link to sign in.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                3
              </span>
              <span>
                Sign in to your Bimble clinic portal and click{" "}
                <strong className="text-foreground">Open EMR</strong> to launch
                OSCAR — no separate login required.
              </span>
            </li>
          </ol>
        </div>

        {/* Email notice */}
        <div className="flex items-start gap-3 rounded-xl border border-border bg-blue-50/50 p-4">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to you. Keep an eye on your
            inbox — your credentials will arrive there once the clinic is
            approved. Check your spam folder if you don&#39;t see it, or
            contact{" "}
            <a
              href="mailto:support@bimble.pro"
              className="text-primary underline underline-offset-2"
            >
              support@bimble.pro
            </a>
            .
          </p>
        </div>

        {clinicCode && (
          <div className="rounded-xl border border-border bg-slate-50 px-5 py-3 text-sm">
            <span className="text-muted-foreground">Clinic code: </span>
            <span className="font-mono font-semibold text-foreground">
              {clinicCode}
            </span>
          </div>
        )}

        <Button
          type="button"
          className="h-12 w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => router.push("/")}
        >
          Back to home
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-12 w-full"
          onClick={() => router.push("/login")}
        >
          Clinic login
        </Button>
      </div>
    </ClinicFlowShell>
  );
}
