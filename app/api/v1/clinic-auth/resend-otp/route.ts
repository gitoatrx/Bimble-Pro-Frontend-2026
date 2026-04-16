import { NextResponse } from "next/server";
import {
  extractBackendErrorMessage,
  requestBackendApiJson,
} from "@/lib/api/backend";
import type { ClinicLoginStep1Response, ClinicOtpResendRequest } from "@/lib/clinic/types";

export async function POST(request: Request) {
  let payload: ClinicOtpResendRequest;

  try {
    payload = (await request.json()) as ClinicOtpResendRequest;
  } catch {
    return NextResponse.json(
      { message: "Invalid request payload." },
      { status: 400 },
    );
  }

  if (!payload.otp_token?.trim()) {
    return NextResponse.json(
      { message: "OTP token is required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/clinic-auth/resend-otp",
      method: "POST",
      body: payload,
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Could not resend the code. Please try again.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data as ClinicLoginStep1Response, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the login service. Please try again." },
      { status: 502 },
    );
  }
}
