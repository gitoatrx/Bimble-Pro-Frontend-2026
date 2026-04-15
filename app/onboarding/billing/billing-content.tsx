"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, ReceiptText } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { Button } from "@/components/ui/button";

export default function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clinicCode = searchParams.get("clinicCode");
  const planName = searchParams.get("planName");
  const message = searchParams.get("message");

  useEffect(() => {
    if (!clinicCode) {
      router.replace("/onboarding");
    }
  }, [clinicCode, router]);

  return (
    <ClinicFlowShell backHref="/onboarding" backLabel="Back to onboarding">
      <div className="mx-auto max-w-2xl space-y-6 rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              Registration complete
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Your clinic has been created
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              We kept you inside the app instead of sending you to the private
              backend checkout URL, so the page stays responsive here.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ReceiptText className="h-4 w-4 text-primary" />
            Billing summary
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Clinic code
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {clinicCode ?? "Pending"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Plan
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {planName ?? "Selected plan"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Next step
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                Continue setup from this screen
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Status
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {message ?? "Clinic registration successful."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="h-12 flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => router.push("/login")}
          >
            Continue to login
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
