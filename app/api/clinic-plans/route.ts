import { NextResponse } from "next/server";
import type { BackendPlan, ClinicPlan } from "@/lib/clinic/types";

const BIMBLE_API_BASE_URL =
  process.env.BIMBLE_API_BASE_URL ?? "http://localhost:8000/api/v1";

function centsToCAD(cents: number): string {
  return `CAD ${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 0 })}`;
}

function mapBackendPlanToClinicPlan(plan: BackendPlan): ClinicPlan {
  const monthlyPrice = centsToCAD(plan.monthly_price_cents);
  const annualPrice = centsToCAD(plan.monthly_price_cents * 10);

  return {
    id: plan.plan_code,
    name: plan.plan_name,
    subtitle: plan.description ?? "Everything your clinic needs to get started.",
    priceLabel: `${monthlyPrice} / month`,
    billingInterval: "Billed monthly after the trial",
    trialDays: 90,
    monthlyPriceCents: plan.monthly_price_cents,
    features: [
      `${plan.base_seats} included seats`,
      "90-day free trial",
      "Clinic setup workflow",
      "Core scheduling tools",
      "Secure OTP booking",
      "AI-assisted notes",
    ],
    recommended: plan.plan_code === "premium",
    billingCycle: "monthly",
  };
}

export async function GET() {
  try {
    const backendResponse = await fetch(`${BIMBLE_API_BASE_URL}/plans`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend returned ${backendResponse.status}`);
    }

    const backendPlans = (await backendResponse.json()) as BackendPlan[];
    const plans: ClinicPlan[] = backendPlans.map(mapBackendPlanToClinicPlan);

    return NextResponse.json(plans, { status: 200 });
  } catch {
    // Return an empty array — the plan page falls back to defaults when empty
    return NextResponse.json([], { status: 200 });
  }
}
