import { NextResponse } from "next/server";
import {
  extractBackendErrorMessage,
  requestBackendApiJson,
} from "@/lib/api/backend";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const authHeader = request.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { message: "A valid doctor email address is required." },
      { status: 400 },
    );
  }

  if (!accessToken) {
    return NextResponse.json(
      { message: "Authentication token is required." },
      { status: 401 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: `/clinics/doctors/invite-prefill?email=${encodeURIComponent(email)}`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Failed to load doctor prefill.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data ?? {}, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the invite prefill service." },
      { status: 502 },
    );
  }
}
