import { buildBackendApiUrl } from "@/lib/api/backend";

function copyRequestHeaders(request: Request) {
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");

  return headers;
}

function buildBackendPath(path: string, search = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanPath}${search}`;
}

export async function proxyClinicBackendRequest(
  request: Request,
  backendPath: string,
) {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  const response = await fetch(
    buildBackendApiUrl(buildBackendPath(backendPath, url.search)),
    {
      method,
      headers: copyRequestHeaders(request),
      body,
    },
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}
