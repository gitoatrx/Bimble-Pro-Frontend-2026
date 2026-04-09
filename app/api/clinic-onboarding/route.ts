import { NextResponse } from "next/server";
import type { ClinicRegisterRequest } from "@/lib/clinic/types";

const CLINIC_REGISTER_API_URL =
  process.env.CLINIC_REGISTER_API_URL ??
  "http://127.0.0.1:8096/api/clinics/register";

function hasRequiredRegisterFields(payload: ClinicRegisterRequest) {
  return Boolean(
    payload.clinic_legal_name.trim() &&
      payload.clinic_display_name.trim() &&
      Number.isFinite(payload.established_year) &&
      payload.address.trim() &&
      payload.city.trim() &&
      payload.province.trim() &&
      payload.postal_code.trim() &&
      payload.email.trim() &&
      payload.phone_number.trim() &&
      payload.clinic_type.trim() &&
      Array.isArray(payload.services_provided) &&
      payload.services_provided.length > 0,
  );
}

function extractErrorMessage(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return "Clinic registration failed.";
}

export async function POST(request: Request) {
  let payload: ClinicRegisterRequest;

  try {
    payload = (await request.json()) as ClinicRegisterRequest;
  } catch {
    return NextResponse.json(
      { message: "Invalid clinic registration payload." },
      { status: 400 },
    );
  }

  if (!hasRequiredRegisterFields(payload)) {
    return NextResponse.json(
      { message: "Please submit all required clinic onboarding fields." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(CLINIC_REGISTER_API_URL, {
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

    return NextResponse.json(responseData, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      {
        message:
          "We could not reach the clinic registration service right now.",
      },
      { status: 502 },
    );
  }
}
