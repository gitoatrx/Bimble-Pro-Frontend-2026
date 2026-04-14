"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ClinicFlowShell } from "@/components/clinic-access/clinic-flow-shell";
import { ClinicPlanOptionCard } from "@/components/clinic-access/clinic-plan-option-card";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequest } from "@/lib/api/request";
import {
  readClinicSelectedPlan,
  storeClinicSelectedPlan,
} from "@/lib/clinic/session";
import type {
  ClinicBillingCycle,
  ClinicPlan,
} from "@/lib/clinic/types";
import { cn } from "@/lib/utils";

function getPricingForCycle(
  plan: ClinicPlan,
  cycle: ClinicBillingCycle,
): { priceLabel: string; billingInterval: string; subtitle: string } {
  if (cycle === "annual") {
    const annualCents = plan.monthlyPriceCents * 10;
    const annualCAD = (annualCents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0 });
    return {
      priceLabel: `CAD ${annualCAD} / year`,
      billingInterval: "Billed annually after the 90-day trial",
      subtitle: "2 months free with annual billing.",
    };
  }

  return {
    priceLabel: plan.priceLabel,
    billingInterval: "Billed monthly after the 90-day trial",
    subtitle: plan.subtitle,
  };
}

const comparisonRows = [
  {
    title: "Trial length",
    description: "Start with the same runway on both plans.",
    standard: "90 days included",
    premium: "90 days included",
  },
  {
    title: "Clinic setup",
    description: "Core onboarding and workflow setup are included everywhere.",
    standard: "Included",
    premium: "Included",
  },
  {
    title: "Support",
    description: "Upgrade support when your team needs faster help.",
    standard: "Email support",
    premium: "Priority support",
  },
  {
    title: "Automation",
    description: "Pick the right amount of automation for your volume.",
    standard: "Core workflow",
    premium: "Advanced automation",
  },
  {
    title: "Best fit",
    description: "See which plan lines up with your clinic today.",
    standard: "Smaller teams",
    premium: "Busy multi-provider clinics",
  },
];


export default function ClinicPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<ClinicPlan[]>([]);
  const [billingCycle, setBillingCycle] =
    useState<ClinicBillingCycle>("monthly");
  const [selectedPlanId, setSelectedPlanId] =
    useState<ClinicPlan["id"] | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    const storedPlan = readClinicSelectedPlan();

    if (storedPlan) {
      setSelectedPlanId(storedPlan.id);
      setBillingCycle(storedPlan.billingCycle ?? "monthly");
    } else {
      const recommendedPlan =
        plans.find((plan) => plan.recommended) ??
        plans[0];

      if (recommendedPlan) {
        setSelectedPlanId(recommendedPlan.id);
      }
    }

    let isActive = true;

    async function loadPlans() {
      try {
        const response = await apiRequest<ClinicPlan[]>({
          endpoint: API_ENDPOINTS.clinicPlans,
        });

        if (isActive && Array.isArray(response) && response.length > 0) {
          setPlans(response);

          if (!storedPlan) {
            const recommendedPlan =
              response.find((plan) => plan.recommended) ?? response[0];

            if (recommendedPlan) {
              setSelectedPlanId(recommendedPlan.id);
            }
          }
        }
      } catch {
        // Backend unavailable — plans will remain empty and UI shows a message.
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
        ...getPricingForCycle(plan, billingCycle),
        billingCycle,
      })),
    [billingCycle, plans],
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

  function handleContinue() {
    if (!selectedPlan) {
      return;
    }

    storeClinicSelectedPlan(selectedPlan);
    router.push("/onboarding");
  }

  return (
    <ClinicFlowShell
      backHref="/"
      backLabel="Back to home"
      contentClassName="max-w-7xl"
    >
      <div className="space-y-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                Step 1 of 3
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Pricing built around calm clinic operations
                  </div>
                  <h1 className="font-display text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
                    Pick the plan that fits your clinic today
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    Compare monthly and annual billing, choose the level of
                    automation you need, and move to card details only after
                    the right plan is selected.
                  </p>
                </div>

                <div className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm">
                  {(
                    [
                      ["monthly", "Monthly"],
                      ["annual", "Annual"],
                    ] as const
                  ).map(([cycle, label]) => (
                    <button
                      key={cycle}
                      type="button"
                      onClick={() => setBillingCycle(cycle)}
                      className={cn(
                        "rounded-full px-5 py-2 text-sm font-semibold transition-all",
                        billingCycle === cycle
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {label}
                        {cycle === "annual" ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            Save 2 months
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
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
              ) : plans.length === 0 ? (
                <p className="text-sm font-medium text-red-500">
                  Could not load plans — make sure the backend is running at localhost:8000.
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {displayPlans.map((plan) => (
                <ClinicPlanOptionCard
                  key={plan.id}
                  plan={plan}
                  selected={selectedPlan?.id === plan.id}
                  onSelect={() => setSelectedPlanId(plan.id)}
                />
              ))}
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-6 py-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                    Feature comparison
                  </p>
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">
                    Compare the plan details side by side
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Both plans include the same trial runway. Premium adds more
                    support and automation for busier clinics.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Built for clearer subscription decisions
                </div>
              </div>

              <div className="divide-y divide-border">
                {comparisonRows.map((row) => (
                  <div
                    key={row.title}
                    className="grid gap-3 px-6 py-4 sm:grid-cols-[1.2fr_0.9fr_0.9fr] sm:px-8"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {row.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {row.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-slate-50 px-4 py-3 text-sm font-medium text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {row.standard}
                    </div>

                    <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {row.premium}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[2rem] border border-primary/20 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                  Selected plan
                </p>
                {selectedPlan?.recommended ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Recommended
                  </span>
                ) : null}
              </div>

              <h2 className="mt-3 text-2xl font-semibold text-foreground">
                {selectedPlan?.name ?? "Choose a plan"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {selectedPlan?.subtitle ??
                  "Select a plan to continue to card details."}
              </p>

              <div className="mt-5 rounded-2xl bg-primary/5 p-4">
                <p className="text-3xl font-semibold text-foreground">
                  {selectedPlan?.priceLabel ?? "Select a plan"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedPlan?.billingInterval ??
                    "Your billing details appear on the next step."}
                </p>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock3 className="h-4 w-4 text-primary" />
                  What happens next
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Choose your preferred billing cycle.",
                    "Fill in your clinic details on the next screen.",
                    "Complete payment securely through Stripe to activate your account.",
                  ].map((step, index) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {billingCycle === "annual"
                        ? "Annual billing selected"
                        : "Monthly billing selected"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlan
                        ? `${selectedPlan.billingCycle === "annual" ? "Best value for a longer runway" : "Flexible billing with the same trial"}`
                        : "Choose a plan to see the billing summary."}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Includes
                  </p>
                  <ul className="mt-3 space-y-2">
                    {(selectedPlan?.features ?? [])
                      .slice(0, 3)
                      .map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>

              <Button
                type="button"
                className="mt-6 h-12 w-full rounded-2xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                onClick={handleContinue}
                disabled={!selectedPlan}
              >
                Continue to clinic setup
                <ArrowRight className="h-4 w-4" />
              </Button>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                No charge is made today. Your card details simply prepare the
                trial so the onboarding flow can continue smoothly.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </ClinicFlowShell>
  );
}
