"use client";

import { useSearchParams } from "next/navigation";
import { DoctorOnboardingWizard } from "@/components/doctor/doctor-onboarding-wizard";

const onboardingStages = new Set(["hlth_2870", "hlth_2950", "hlth_2832", "hlth_2991", "hlth_2820"]);

export default function DoctorOnboardingPage() {
  const searchParams = useSearchParams();
  const requestedStage = searchParams.get("stage") ?? "";
  const initialStage = onboardingStages.has(requestedStage) ? requestedStage : "hlth_2870";
  const optionalMode = searchParams.get("optional") === "1";


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(255,255,255,1)_100%)]">
      <DoctorOnboardingWizard
        initialStage={initialStage as "hlth_2870" | "hlth_2950" | "hlth_2832" | "hlth_2991" | "hlth_2820"}
        optionalMode={optionalMode}
      />
    </div>
  );
}
