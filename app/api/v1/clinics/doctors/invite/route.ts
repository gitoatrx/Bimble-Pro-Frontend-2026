import { NextResponse } from "next/server";
import {
  extractBackendErrorMessage,
  requestBackendApiJson,
} from "@/lib/api/backend";

type InviteRequestBody = {
  email: string;
  access_token: string;
};

function decodeClinicIdFromToken(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → Base64 → JSON
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf-8");
    const claims = JSON.parse(json) as Record<string, unknown>;
    // The backend JWT uses "clinic_id" or "sub" (as a numeric string)
    if (typeof claims.clinic_id === "number") return claims.clinic_id;
    if (typeof claims.clinic_id === "string") {
      const n = parseInt(claims.clinic_id, 10);
      if (!isNaN(n)) return n;
    }
    if (typeof claims.sub === "number") return claims.sub;
    if (typeof claims.sub === "string") {
      const n = parseInt(claims.sub, 10);
      if (!isNaN(n)) return n;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: InviteRequestBody;

  try {
    body = (await request.json()) as InviteRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Invalid request payload." },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const accessToken = body.access_token?.trim();

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

  const clinicId = decodeClinicIdFromToken(accessToken);

  if (!clinicId) {
    return NextResponse.json(
      { message: "Could not determine clinic identity from session token." },
      { status: 401 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: `/clinics/${clinicId}/doctors/invite`,
      method: "POST",
      body: { email },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Failed to send the doctor invite. Please try again.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data ?? { message: "Invite sent." }, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the invite service. Please try again." },
      { status: 502 },
    );
  }
}
