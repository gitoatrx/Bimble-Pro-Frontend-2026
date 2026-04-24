import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const params = await context.params;
  const token = params.token?.trim();

  if (!token) {
    return NextResponse.json({ message: "Invite token is required." }, { status: 400 });
  }

  try {
    const res = await requestBackendApiJson({
      path: `/doctor-auth/invite/${token}`,
      method: "GET",
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: extractBackendErrorMessage(res.data, "Failed to load invite.") },
        { status: res.status },
      );
    }

    return NextResponse.json(res.data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Could not reach the invite service." }, { status: 502 });
  }
}
