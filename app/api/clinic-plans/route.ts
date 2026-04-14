import { NextResponse } from "next/server";
import {
  buildBackendApiUrl,
  extractBackendErrorMessage,
} from "@/lib/api/backend";
import type { BackendPlan, ClinicPlan } from "@/lib/clinic/types";

function centsToCAD(cents: number): string {
  return `CAD ${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0 })}`;
}

function formatProviderLimit(providerLimit: number | null) {
  if (providerLimit === null) {
    return "Unlimited provider access";
  }

  return `${providerLimit} provider${providerLimit === 1 ? "" : "s"} included`;
}

function mapBackendPlanToClinicPlan(plan: BackendPlan): ClinicPlan {
  const monthlyPrice = centsToCAD(plan.monthly_price_cents);
  const fallbackFeatures = [
    "90-day free trial",
    "Clinic setup workflow",
    "Core scheduling tools",
    "Secure OTP booking",
    "AI-assisted notes",
  ];
  const featureHighlights = [
    formatProviderLimit(plan.provider_limit),
    ...(plan.benefits.length > 0 ? plan.benefits : fallbackFeatures),
  ].slice(0, 6);

  return {
    id: plan.plan_code,
    name: plan.plan_name,
    subtitle: plan.description ?? "Everything your clinic needs to get started.",
    priceLabel: `${monthlyPrice} / month`,
    billingInterval: "Billed monthly after the trial",
    trialDays: 90,
    monthlyPriceCents: plan.monthly_price_cents,
    features: featureHighlights,
    recommended: plan.plan_code.toLowerCase() === "premium",
    billingCycle: "monthly",
  };
}

export async function GET() {
  try {
    const backendResponse = await fetch(buildBackendApiUrl("/plans"), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const responseData = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            responseData,
            "Could not load plans from the backend.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    if (!Array.isArray(responseData)) {
      return NextResponse.json(
        { message: "Plans service returned an unexpected response." },
        { status: 502 },
      );
    }

    const backendPlans = responseData as BackendPlan[];
    const plans: ClinicPlan[] = backendPlans.map(mapBackendPlanToClinicPlan);

    return NextResponse.json(plans, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the plans service. Please try again." },
      { status: 502 },
    );
  }
}
