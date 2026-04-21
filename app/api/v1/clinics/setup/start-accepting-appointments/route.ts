import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";

export async function PATCH(request: Request) {
  let payload: { enabled?: boolean; doctor_ids?: number[] };
  const authHeader = request.headers.get("Authorization") ?? "";
  const accessToken = authHeader.replace(/^Bearer\s+/i, "").trim();

  try {
    payload = (await request.json()) as { enabled?: boolean };
  } catch {
    return NextResponse.json({ message: "Invalid request payload." }, { status: 400 });
  }

  if (payload.enabled !== true) {
    return NextResponse.json({ message: "enabled must be true." }, { status: 400 });
  }
  if (!Array.isArray(payload.doctor_ids)) {
    return NextResponse.json({ message: "doctor_ids must be an array." }, { status: 400 });
  }
  if (!accessToken) {
    return NextResponse.json(
      { message: "Authentication token is required." },
      { status: 401 },
    );
  }

  try {
    const backendResponse = await requestBackendApiJson({
      path: "/clinics/setup/start-accepting-appointments",
      method: "PATCH",
      body: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: extractBackendErrorMessage(
            backendResponse.data,
            "Could not start accepting appointments. Please try again.",
          ),
        },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(backendResponse.data, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Could not reach the setup service. Please try again." },
      { status: 502 },
    );
  }
}
