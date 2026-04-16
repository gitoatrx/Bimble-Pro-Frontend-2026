import { NextResponse } from "next/server";
import {
  extractBackendErrorMessage,
  requestBackendApiJson,
} from "@/lib/api/backend";

function decodeClinicIdFromToken(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf-8");
    const claims = JSON.parse(json) as Record<string, unknown>;
    if (typeof claims.clinic_id === "number") return claims.clinic_id;
    if (typeof claims.clinic_id === "string") {
      const n = parseInt(claims.clinic_id, 10);
      if (!isNaN(n)) return n;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!accessToken) {
    return NextResponse.json({ message: "Authentication token is required." }, { status: 401 });
  }

  const clinicId = decodeClinicIdFromToken(accessToken);
  if (!clinicId) {
    return NextResponse.json(
      { message: "Could not determine clinic identity from session token." },
      { status: 401 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: `/clinics/${clinicId}/doctors/invites`,
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
