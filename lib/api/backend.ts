const DEFAULT_BIMBLE_API_BASE_URL = "http://172.16.172.197:8000/api/v1";

function normalizeBackendBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_BIMBLE_API_BASE_URL;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  return withProtocol.replace(/\/+$/, "");
}

export function getBackendApiBaseUrl() {
  return normalizeBackendBaseUrl(process.env.BIMBLE_API_BASE_URL);
}

export function buildBackendApiUrl(path: string) {
  const cleanPath = path.replace(/^\/+/, "");
  return new URL(cleanPath, `${getBackendApiBaseUrl()}/`).toString();
}

type BackendRequestConfig = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export type BackendJsonResponse = {
  ok: boolean;
  status: number;
  data: unknown;
};

export async function requestBackendApiJson({
  path,
  method = "GET",
  body,
  headers,
  cache = "no-store",
}: BackendRequestConfig): Promise<BackendJsonResponse> {
  const response = await fetch(buildBackendApiUrl(path), {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache,
  });

  const data = await response.json().catch(() => null);

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export function extractBackendErrorMessage(
  data: unknown,
  fallbackMessage: string,
) {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.detail === "string") return obj.detail;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;

    if (Array.isArray(obj.detail) && obj.detail.length > 0) {
      const first = obj.detail[0] as Record<string, unknown>;

      if (first && typeof first.msg === "string") {
        return first.msg;
      }
    }
  }

  return fallbackMessage;
}
