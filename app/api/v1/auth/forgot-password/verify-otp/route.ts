import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";
import type { ForgotPasswordVerifyOtpRequest, ForgotPasswordVerifyOtpResponse } from "@/lib/auth/password-reset";

function hasRequiredFields(payload: ForgotPasswordVerifyOtpRequest): boolean {
  return Boolean(payload.reset_token?.trim() && payload.otp_code?.trim());
}

export async function POST(request: Request) {
  let payload: ForgotPasswordVerifyOtpRequest;

  try {
    payload = (await request.json()) as ForgotPasswordVerifyOtpRequest;
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (!hasRequiredFields(payload)) {
    return NextResponse.json(
      { message: "Reset token and code are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/auth/forgot-password/verify-otp",
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

    return NextResponse.json(backendResponse.data as ForgotPasswordVerifyOtpResponse, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the password reset service. Please try again." },
      { status: 502 },
    );
  }
}
