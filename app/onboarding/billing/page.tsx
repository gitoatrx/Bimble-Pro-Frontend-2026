import { Suspense } from "react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import BillingContent from "./billing-content";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <ClinicFlowShell backHref="/onboarding" backLabel="Back to onboarding">
          <div className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm leading-6 text-muted-foreground">
              Preparing billing details...
            </p>
          </div>
        </ClinicFlowShell>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
