import { NextResponse } from "next/server";
import { buildBackendApiUrl, extractBackendErrorMessage } from "@/lib/api/backend";

export async function POST(request: Request) {
  let payload: { clinic_slug: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid payload." }, { status: 400 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.trim()) {
    return NextResponse.json({ message: "Missing doctor session." }, { status: 401 });
  }

  try {
    const response = await fetch(buildBackendApiUrl("/doctor-auth/switch-clinic"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { message: extractBackendErrorMessage(data, "Could not switch clinic.") },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "Could not reach the switch-clinic service." }, { status: 502 });
  }
}
