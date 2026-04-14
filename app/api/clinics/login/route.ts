import { NextResponse } from "next/server";
import type { ClinicLoginRequest, ClinicLoginResponse } from "@/lib/clinic/types";

const BIMBLE_API_BASE_URL =
  process.env.BIMBLE_API_BASE_URL ?? "http://localhost:8000/api/v1";

function hasRequiredFields(payload: ClinicLoginRequest): boolean {
  return Boolean(
    payload.clinic_slug?.trim() &&
      payload.username?.trim() &&
      payload.password?.trim(),
  );
}

function extractErrorMessage(data: unknown): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  return "Clinic login failed. Please check your credentials and try again.";
}

export async function POST(request: Request) {
  let payload: ClinicLoginRequest;

  try {
    payload = (await request.json()) as ClinicLoginRequest;
  } catch {
    return NextResponse.json(
      { message: "Invalid login payload." },
      { status: 400 },
    );
  }

  if (!hasRequiredFields(payload)) {
    return NextResponse.json(
      { message: "Clinic slug, username, and password are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${BIMBLE_API_BASE_URL}/clinic-auth/login`, {
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

    return NextResponse.json(responseData as ClinicLoginResponse, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the login service. Please try again." },
      { status: 502 },
    );
  }
}
