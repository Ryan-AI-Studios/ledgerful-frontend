import { buildApiUrl, getAuthToken, resetInMemoryToken } from "./utils";

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

/**
 * Generation-aware 401/403 invalidation: only clear the session when the token
 * used for *this* request is still the active one. Skips stale stragglers after
 * re-auth and dedupes concurrent same-token 401 bursts to a single reset.
 */
function maybeInvalidateSession(
  status: number,
  tokenUsedForThisRequest: string | null,
): void {
  if (status !== 401 && status !== 403) return;
  if (tokenUsedForThisRequest === null) return;
  if (getAuthToken() !== tokenUsedForThisRequest) return;
  resetInMemoryToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ledgerful:session-invalid"));
  }
}

/**
 * Low-level fetch primitive: attaches Bearer when present, runs session
 * invalidation on 401/403, returns the raw Response. JSON callers use
 * `apiRequest`; blob/download callers (e.g. SOC2 export) use this directly.
 */
export async function apiFetch(
  path: string,
  init?: RequestInit,
  params?: Record<string, string | undefined>,
): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(buildApiUrl(path, params), { ...init, headers });
  maybeInvalidateSession(res.status, token);
  return res;
}

export async function apiRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  params?: Record<string, string | undefined>,
): Promise<T> {
  const init: RequestInit = { method, signal: AbortSignal.timeout(5000) };

  if (method === "POST" && body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  const res = await apiFetch(path, init, params);

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

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiError(500, "Invalid JSON response from server");
  }
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
