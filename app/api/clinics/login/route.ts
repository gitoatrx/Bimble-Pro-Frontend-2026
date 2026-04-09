import { NextResponse } from "next/server";
import type { ClinicLoginRequest } from "@/lib/clinic/types";

const CLINIC_LOGIN_API_URL =
  process.env.CLINIC_LOGIN_API_URL ??
  "http://127.0.0.1:8096/api/clinics/login";

function hasRequiredLoginFields(payload: ClinicLoginRequest) {
  return Boolean(
    payload.clinic_name.trim() &&
      payload.username.trim() &&
      payload.password.trim() &&
      /^\d{4}$/.test(payload.pin),
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

  return "Clinic login failed.";
}

export async function POST(request: Request) {
  let payload: ClinicLoginRequest;

  try {
    payload = (await request.json()) as ClinicLoginRequest;
  } catch {
    return NextResponse.json(
      { message: "Invalid clinic login payload." },
      { status: 400 },
    );
  }

  if (!hasRequiredLoginFields(payload)) {
    return NextResponse.json(
      { message: "Please submit all required clinic login fields." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(CLINIC_LOGIN_API_URL, {
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
      { message: "We could not reach the clinic login service right now." },
      { status: 502 },
    );
  }
}
