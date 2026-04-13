"use client";

import { useEffect, useState } from "react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicPlanOptionCard } from "@/components/clinic-access/clinic-plan-option-card";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";
import {
  defaultClinicPlans,
} from "@/lib/clinic/billing";
import {
  readClinicSelectedPlan,
  storeClinicSelectedPlan,
} from "@/lib/clinic/session";
import type { ClinicPlan } from "@/lib/clinic/types";

export default function ClinicPlanPage() {
  const [plans, setPlans] = useState<ClinicPlan[]>(defaultClinicPlans);
  const [selectedPlan, setSelectedPlan] = useState<ClinicPlan | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    const storedPlan = readClinicSelectedPlan();

    if (storedPlan) {
      setSelectedPlan(storedPlan);
    }

    let isActive = true;

    async function loadPlans() {
      try {
        const response = await apiRequest<ClinicPlan[]>({
          endpoint: API_ENDPOINTS.clinicPlans,
        });

        if (isActive && Array.isArray(response) && response.length > 0) {
          setPlans(response);
          if (storedPlan) {
            const matchedPlan =
              response.find((plan) => plan.id === storedPlan.id) ?? storedPlan;
            setSelectedPlan(matchedPlan);
          }
        }
      } catch {
        // Keep the local defaults when the plan endpoint is unavailable.
      } finally {
        if (isActive) {
          setIsLoadingPlans(false);
        }
      }
    }

    void loadPlans();

    return () => {
      isActive = false;
    };
  }, []);

  function handleSelectPlan(plan: ClinicPlan) {
    setSelectedPlan(plan);
    storeClinicSelectedPlan(plan);
    window.location.assign("/onboarding/billing");
  }

  return (
    <ClinicFlowShell backHref="/" backLabel="Back to home">
      <div className="max-w-5xl space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
            Step 1 of 3
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              Choose your plan
            </h1>
          </div>
        </div>

        {isLoadingPlans ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {defaultClinicPlans.map((plan) => (
              <div
                key={plan.id}
                className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {plans.map((plan) => (
              <ClinicPlanOptionCard
                key={plan.id}
                plan={plan}
                selected={selectedPlan?.id === plan.id}
                onSelect={() => handleSelectPlan(plan)}
              />
            ))}
          </div>
        )}
      </div>
    </ClinicFlowShell>
  );
}
