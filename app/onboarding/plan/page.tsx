"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicPlanOptionCard } from "@/components/clinic-access/clinic-plan-option-card";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { ApiRequestError, apiRequest } from "@/lib/api/request";
import {
  readClinicSelectedPlan,
  storeClinicSelectedPlan,
} from "@/lib/clinic/session";
import type { ClinicPlan } from "@/lib/clinic/types";

/** Plans are shown with monthly pricing only on this step. */
const BILLING_CYCLE = "monthly" as const;

export default function ClinicPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ClinicPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] =
    useState<ClinicPlan["id"] | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    const storedPlan = readClinicSelectedPlan();

    if (storedPlan) {
      setSelectedPlanId(storedPlan.id);
    }

    let isActive = true;

    async function loadPlans() {
      try {
        const response = await apiRequest<ClinicPlan[]>({
          endpoint: API_ENDPOINTS.clinicPlans,
        });

        if (!isActive) {
          return;
        }

        if (Array.isArray(response) && response.length > 0) {
          setPlans(response);
          setPlansError(null);

          const matchingStoredPlan = storedPlan
            ? response.find((plan) => plan.id === storedPlan.id)
            : null;

          if (storedPlan && !matchingStoredPlan) {
            const recommendedPlan =
              response.find((plan) => plan.recommended) ?? response[0];

            if (recommendedPlan) {
              setSelectedPlanId(recommendedPlan.id);
            }
          } else if (!storedPlan) {
            const recommendedPlan =
              response.find((plan) => plan.recommended) ?? response[0];

            if (recommendedPlan) {
              setSelectedPlanId(recommendedPlan.id);
            }
          }

          return;
        }

        setPlans([]);
        setPlansError("No plans are available right now.");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setPlansError(
          error instanceof ApiRequestError
            ? error.message
            : "Could not load plans right now. Please try again.",
        );
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

  const displayPlans = useMemo(
    () =>
      plans.map((plan) => ({
        ...plan,
        billingCycle: BILLING_CYCLE,
      })),
    [plans],
  );

  const selectedPlan = useMemo(() => {
    return (
      displayPlans.find((plan) => plan.id === selectedPlanId) ??
      displayPlans.find((plan) => plan.recommended) ??
      displayPlans[0] ??
      null
    );
  }, [displayPlans, selectedPlanId]);

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }

    storeClinicSelectedPlan(selectedPlan);
  }, [selectedPlan]);

  function handleChoosePlan(plan: (typeof displayPlans)[number]) {
    storeClinicSelectedPlan(plan);
    router.push("/onboarding");
  }

  return (
    <ClinicFlowShell
      backHref="/"
      backLabel="Back to home"
      contentClassName="max-w-7xl"
    >
      <div className="space-y-10">
        <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                Step 1 of 3
              </div>

              <div className="max-w-3xl space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Pricing built around calm clinic operations
                </div>
                <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
                  Pick the plan that fits your clinic today
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  Monthly billing after your trial. Choose a plan to continue to
                  clinic setup.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  "90-day trial",
                  "Secure OTP booking",
                  "AI-assisted notes",
                  "Switch anytime before checkout",
                ].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              {isLoadingPlans ? (
                <p className="text-sm font-medium text-muted-foreground">
                  Loading plans from backend...
                </p>
              ) : plansError ? (
                <p className="text-sm font-medium text-red-500">
                  {plansError}
                </p>
              ) : plans.length === 0 ? (
                <p className="text-sm font-medium text-red-500">
                  No plans are available right now.
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {displayPlans.map((plan) => (
                <ClinicPlanOptionCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={() => handleChoosePlan(plan)}
                />
              ))}
            </div>

            <p className="text-sm leading-6 text-muted-foreground">
              No charge is made today. Your card details prepare the trial so
              clinic setup can continue smoothly.
            </p>
        </div>
      </div>
    </ClinicFlowShell>
  );
}
