import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";
import type { ForgotPasswordRequestOtpRequest, ForgotPasswordRequestOtpResponse } from "@/lib/auth/password-reset";

function hasRequiredFields(payload: ForgotPasswordRequestOtpRequest): boolean {
  return Boolean(payload.email?.trim() && payload.account_type?.trim());
}

export async function POST(request: Request) {
  let payload: ForgotPasswordRequestOtpRequest;

  try {
    payload = (await request.json()) as ForgotPasswordRequestOtpRequest;
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (!hasRequiredFields(payload)) {
    return NextResponse.json(
      { message: "Email and account type are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/auth/forgot-password/request-otp",
      method: "POST",
      body: payload,
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Could not send the reset code. Please try again.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data as ForgotPasswordRequestOtpResponse, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the password reset service. Please try again." },
      { status: 502 },
    );
  }
}
