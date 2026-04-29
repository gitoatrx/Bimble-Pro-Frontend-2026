import { NextResponse } from "next/server";
import { extractBackendErrorMessage, requestBackendApiJson } from "@/lib/api/backend";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function htmlResponse(message: string, status = 200) {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bimble invitation</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f5f8ff;
        color: #0f172a;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main {
        width: min(420px, calc(100vw - 32px));
        border: 1px solid #dbe7ff;
        border-radius: 16px;
        background: #ffffff;
        padding: 28px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        text-align: center;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 22px;
      }
      p {
        margin: 0;
        color: #475569;
        line-height: 1.6;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Invitation updated</h1>
      <p>${escapeHtml(message)}</p>
    </main>
  </body>
</html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const inviteToken = decodeURIComponent(token ?? "").trim();

  if (!inviteToken) {
    return htmlResponse("Invite token is missing.", 400);
  }

  try {
    const res = await requestBackendApiJson({
      path: "/doctor-auth/invite-reject",
      method: "POST",
      body: { invite_token: inviteToken },
    });

    if (!res.ok) {
      return htmlResponse(
        extractBackendErrorMessage(res.data, "Failed to reject this invite."),
        res.status,
      );
    }

    return htmlResponse("This clinic invitation has been rejected. You can close this tab.");
  } catch {
    return htmlResponse("Could not reach the invite service.", 502);
  }
}
