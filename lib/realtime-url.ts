const DEFAULT_BIMBLE_WS_URL = "ws://localhost:8000/api/v1/realtime/ws";
const DEFAULT_BIMBLE_API_BASE_URL = "http://localhost:8000/api/v1";

function normalizeUrlInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (/^wss?:\/\//i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, "");
  }

  return `http://${trimmed}`.replace(/\/+$/, "");
}

function appendAccessToken(url: URL, accessToken: string) {
  if (accessToken) {
    url.searchParams.set("access_token", accessToken);
  }

  return url;
}

function normalizeRealtimeProtocol(url: URL) {
  if (url.protocol === "https:") {
    url.protocol = "wss:";
  } else if (url.protocol === "http:") {
    url.protocol = "ws:";
  }

  return url;
}

function buildConfiguredRealtimeUrl(configuredUrl: string, accessToken: string) {
  const normalized = normalizeUrlInput(configuredUrl);
  const url = normalizeRealtimeProtocol(new URL(normalized));
  return appendAccessToken(url, accessToken).toString();
}

function buildDerivedRealtimeUrl(apiBaseUrl: string, accessToken: string) {
  const normalized = normalizeUrlInput(apiBaseUrl);
  const url = new URL("realtime/ws", `${normalized}/`);
  normalizeRealtimeProtocol(url);
  return appendAccessToken(url, accessToken).toString();
}

export function buildRealtimeUrl(accessToken: string) {
  const configuredWsUrl = process.env.NEXT_PUBLIC_BIMBLE_WS_URL?.trim();
  if (configuredWsUrl) {
    return buildConfiguredRealtimeUrl(configuredWsUrl, accessToken);
  }

  const publicApiBaseUrl = process.env.NEXT_PUBLIC_BIMBLE_API_BASE_URL?.trim();
  if (publicApiBaseUrl) {
    return buildDerivedRealtimeUrl(publicApiBaseUrl, accessToken);
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname || "localhost";
    const url = new URL(`${protocol}//${hostname}:8000/api/v1/realtime/ws`);
    return appendAccessToken(url, accessToken).toString();
  }

  const fallback = new URL(DEFAULT_BIMBLE_WS_URL);
  return appendAccessToken(fallback, accessToken).toString();
}

export function buildRealtimeApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_BIMBLE_API_BASE_URL?.trim();
  if (configured) {
    return normalizeUrlInput(configured);
  }

  return DEFAULT_BIMBLE_API_BASE_URL;
}
