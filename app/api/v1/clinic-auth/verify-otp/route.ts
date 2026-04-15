import { NextResponse } from "next/server";
import {
  extractBackendErrorMessage,
  requestBackendApiJson,
} from "@/lib/api/backend";
import type { ClinicLoginResponse, ClinicOtpVerifyRequest } from "@/lib/clinic/types";

function hasRequiredFields(payload: ClinicOtpVerifyRequest): boolean {
  return Boolean(payload.otp_token?.trim() && payload.otp_code?.trim());
}

export async function POST(request: Request) {
  let payload: ClinicOtpVerifyRequest;

  try {
    payload = (await request.json()) as ClinicOtpVerifyRequest;
  } catch {
    return NextResponse.json(
      { message: "Invalid request payload." },
      { status: 400 },
    );
  }

  if (!hasRequiredFields(payload)) {
    return NextResponse.json(
      { message: "Verification token and code are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/clinic-auth/verify-otp",
      method: "POST",
      body: payload,
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Verification failed. Please check your code and try again.",
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
      { message: "Could not reach the verification service. Please try again." },
      { status: 502 },
    );
  }
}
