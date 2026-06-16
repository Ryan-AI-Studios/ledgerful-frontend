import { buildApiUrl } from "./utils";

export class ApiError extends Error {
  status: number;
  info?: unknown;

  constructor(status: number, message: string, info?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.info = info;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface ErrorBody {
  error?: boolean;
  status?: number;
  message?: string;
}

export async function apiRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  params?: Record<string, string | undefined>,
): Promise<T> {
  const init: RequestInit = { method };

  if (method === "POST" && body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const res = await fetch(buildApiUrl(path, params), init);

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as ErrorBody;
      if (data.message) message = data.message;
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, message);
  }

  return (await res.json()) as T;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
): Promise<T> {
  return apiRequest<T>("GET", path, undefined, params);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  params?: Record<string, string | undefined>,
): Promise<T> {
  return apiRequest<T>("POST", path, body, params);
}
