import { NextResponse } from "next/server";
import {
  buildBackendApiUrl,
  extractBackendErrorMessage,
} from "@/lib/api/backend";
import type { ClinicRegisterRequest, ClinicRegisterResponse } from "@/lib/clinic/types";

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
    const backendResponse = await fetch(buildBackendApiUrl("/clinics/signup"), {
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
        {
          message: extractBackendErrorMessage(
            responseData,
            "Clinic registration failed. Please try again.",
          ),
        },
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
