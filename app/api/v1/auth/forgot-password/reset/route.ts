import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";
import type { ForgotPasswordResetRequest, ForgotPasswordResetResponse } from "@/lib/auth/password-reset";

function hasRequiredFields(payload: ForgotPasswordResetRequest): boolean {
  return Boolean(
    payload.reset_token?.trim() &&
      payload.new_password?.trim() &&
      payload.confirm_password?.trim(),
  );
}

export async function POST(request: Request) {
  let payload: ForgotPasswordResetRequest;

  try {
    payload = (await request.json()) as ForgotPasswordResetRequest;
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (!hasRequiredFields(payload)) {
    return NextResponse.json(
      { message: "Reset token, new password, and confirmation are required." },
      { status: 400 },
    );
  }

  if (payload.new_password !== payload.confirm_password) {
    return NextResponse.json(
      { message: "Passwords do not match." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/auth/forgot-password/reset",
      method: "POST",
      body: payload,
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Could not reset the password. Please try again.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data as ForgotPasswordResetResponse, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the password reset service. Please try again." },
      { status: 502 },
    );
  }
}
