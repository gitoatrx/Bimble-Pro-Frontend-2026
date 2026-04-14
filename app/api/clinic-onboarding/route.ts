import { NextResponse } from "next/server";
import type { ClinicRegisterRequest, ClinicRegisterResponse } from "@/lib/clinic/types";

const BIMBLE_API_BASE_URL =
  process.env.BIMBLE_API_BASE_URL ?? "http://localhost:8000/api/v1";

function hasRequiredFields(payload: ClinicRegisterRequest): boolean {
  return Boolean(
    payload.clinic_name?.trim() &&
      payload.clinic_legal_name?.trim() &&
      payload.clinic_display_name?.trim() &&
      payload.email?.trim() &&
      payload.phone?.trim() &&
      payload.plan_code?.trim(),
  );
}

function extractErrorMessage(data: unknown): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    // FastAPI validation errors
    if (Array.isArray(obj.detail)) {
      const first = obj.detail[0] as Record<string, unknown>;
      if (typeof first?.msg === "string") return first.msg;
    }
  }
  return "Clinic registration failed. Please try again.";
}

export async function POST(request: Request) {
  let payload: ClinicRegisterRequest;

  try {
    payload = (await request.json()) as ClinicRegisterRequest;
  } catch {
    return NextResponse.json(
      { message: "Invalid registration payload." },
      { status: 400 },
    );
  }

  if (!hasRequiredFields(payload)) {
    return NextResponse.json(
      { message: "Please complete all required fields before submitting." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${BIMBLE_API_BASE_URL}/clinics/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseData = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: extractErrorMessage(responseData) },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(responseData as ClinicRegisterResponse, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the registration service. Please try again." },
      { status: 502 },
    );
  }
}
