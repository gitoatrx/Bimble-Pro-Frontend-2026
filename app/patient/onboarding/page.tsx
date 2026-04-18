import { Suspense } from "react";
import { PatientOnboardingWizard } from "@/components/patient/patient-onboarding-wizard";

export default function PatientOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <PatientOnboardingWizard />
    </Suspense>
  );
}
