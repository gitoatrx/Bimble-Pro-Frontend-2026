export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
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
};

export async function apiRequest<TResponse, TBody = undefined>({
  endpoint,
  method = "GET",
  body,
  headers,
}: RequestConfig<TBody>) {
  const response = await fetch(endpoint, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseData = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData &&
      typeof responseData.message === "string"
        ? responseData.message
        : "Request failed.";

    throw new ApiRequestError(message, response.status);
  }

  return responseData as TResponse;
}
