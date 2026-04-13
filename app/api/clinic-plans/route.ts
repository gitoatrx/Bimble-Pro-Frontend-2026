import { NextResponse } from "next/server";
import { defaultClinicPlans } from "@/lib/clinic/billing";

export async function GET() {
  return NextResponse.json(defaultClinicPlans, { status: 200 });
}
