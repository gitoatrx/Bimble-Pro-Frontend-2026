import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";

export async function POST(request: Request) {
  let payload: {
    invite_token: string;
    first_name: string;
    last_name: string;
    password: string;
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  if (!payload.invite_token?.trim()) {
    return NextResponse.json({ message: "Invite token is required." }, { status: 400 });
  }
  if (!payload.first_name?.trim() || !payload.last_name?.trim()) {
    return NextResponse.json({ message: "First and last name are required." }, { status: 400 });
  }
  if (!payload.password || payload.password.length < 6) {
    return NextResponse.json({ message: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const res = await requestBackendApiJson({
      path: "/doctor-auth/invite-accept",
      method: "POST",
      body: payload,
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: extractBackendErrorMessage(res.data, "Failed to accept invite.") },
        { status: res.status },
      );
    }

    return NextResponse.json(res.data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Could not reach the invite service." }, { status: 502 });
  }
}
