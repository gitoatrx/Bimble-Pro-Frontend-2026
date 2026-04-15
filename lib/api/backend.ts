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

export function buildBackendOriginUrl(path: string) {
  const cleanPath = path.replace(/^\/+/, "");
  const origin = new URL(getBackendApiBaseUrl()).origin;

  return new URL(cleanPath, `${origin}/`).toString();
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
