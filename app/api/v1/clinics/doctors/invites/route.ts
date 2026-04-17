import { NextResponse } from "next/server";
import {
  extractBackendErrorMessage,
  requestBackendApiJson,
} from "@/lib/api/backend";

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return NextResponse.json({ message: "Authentication token is required." }, { status: 401 });
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/clinics/doctors/invites",
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: extractBackendErrorMessage(backendResponse.data, "Failed to load invites.") },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data ?? []);
  } catch {
    return NextResponse.json(
      { message: "Could not reach the invite service." },
      { status: 502 },
    );
  }
}
