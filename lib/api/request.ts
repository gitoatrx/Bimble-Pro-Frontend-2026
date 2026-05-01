export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseData: unknown = null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type RequestConfig<TBody> = {
  endpoint: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: TBody;
  headers?: HeadersInit;
  signal?: AbortSignal;
};

export async function apiRequest<TResponse, TBody = undefined>({
  endpoint,
  method = "GET",
  body,
  headers,
  signal,
}: RequestConfig<TBody>) {
  const response = await fetch(endpoint, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof responseData.message === "string"
        ? responseData.message
        : responseData &&
            typeof responseData === "object" &&
            "detail" in responseData &&
            typeof responseData.detail === "string"
          ? responseData.detail
        : "Request failed.";

    throw new ApiRequestError(message, response.status, responseData);
  }

  return responseData as TResponse;
}
