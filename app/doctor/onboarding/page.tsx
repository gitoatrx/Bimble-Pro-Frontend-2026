"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DoctorOnboardingWizard } from "@/components/doctor/doctor-onboarding-wizard";
import { isDoctorOnboardingComplete, readDoctorLoginSession } from "@/lib/doctor/session";

export default function DoctorOnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    const session = readDoctorLoginSession();
    if (session && isDoctorOnboardingComplete(session.doctorId)) {
      router.replace("/doctor/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.12),_transparent_34%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(255,255,255,1)_100%)]">
      <DoctorOnboardingWizard />
    </div>
  );
}
