import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";

export async function POST(request: Request) {
  let payload: { otp_token: string };
  try { payload = await request.json(); } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  try {
    const res = await requestBackendApiJson({ path: "/doctor-auth/resend-otp", method: "POST", body: payload });
    if (!res.ok) {
      return NextResponse.json(
        { message: extractBackendErrorMessage(res.data, "Could not resend code.") },
        { status: res.status },
      );
    }
    return NextResponse.json(res.data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Could not reach the service." }, { status: 502 });
  }
}
