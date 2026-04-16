import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";

export async function POST(request: Request) {
  let payload: { email: string; password: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  if (!payload.email?.trim() || !payload.password?.trim()) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  try {
    const res = await requestBackendApiJson({ path: "/doctor-auth/login", method: "POST", body: payload });
    if (!res.ok) {
      return NextResponse.json(
        { message: extractBackendErrorMessage(res.data, "Login failed. Please check your credentials.") },
        { status: res.status },
      );
    }
    return NextResponse.json(res.data, { status: res.status });
  } catch {
    return NextResponse.json({ message: "Could not reach the login service." }, { status: 502 });
  }
}
