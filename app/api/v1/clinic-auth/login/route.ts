import { NextResponse } from "next/server";
import {
  extractBackendErrorMessage,
  requestBackendApiJson,
} from "@/lib/api/backend";
import type { ClinicLoginRequest, ClinicLoginResponse } from "@/lib/clinic/types";

function hasRequiredFields(payload: ClinicLoginRequest): boolean {
  return Boolean(
    payload.clinic_slug?.trim() &&
      payload.pin?.trim() &&
      payload.username?.trim() &&
      payload.password?.trim(),
  );
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
      { message: "Clinic slug, PIN, username, and password are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/clinic-auth/login",
      method: "POST",
      body: payload,
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Clinic login failed. Please check your credentials and try again.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data as ClinicLoginResponse, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the login service. Please try again." },
      { status: 502 },
    );
  }
}
