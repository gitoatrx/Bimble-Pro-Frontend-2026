import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";

export async function POST(request: Request) {
  let payload: { invite_token: string };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  if (!payload.invite_token?.trim()) {
    return NextResponse.json({ message: "Invite token is required." }, { status: 400 });
  }

  try {
    const res = await requestBackendApiJson({
      path: "/doctor-auth/invite-reject",
      method: "POST",
      body: payload,
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: extractBackendErrorMessage(res.data, "Failed to reject invite.") },
        { status: res.status },
      );
    }

    return NextResponse.json(res.data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Could not reach the invite service." }, { status: 502 });
  }
}
