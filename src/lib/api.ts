import { SESSION_INVALID_EVENT } from "./events";
import { buildApiUrl, getAuthGeneration, getAuthToken, resetInMemoryToken } from "./utils";

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
 * Invalidate only the session that sent this request, even when a subsequent
 * login used the same token. Concurrent 401 responses cause a single reset.
 * Shared by REST (`apiFetch`) and the SSE client (`sse.ts`).
 */
export function maybeInvalidateSession(
  status: number,
  tokenUsedForThisRequest: string | null,
  generation: number,
): void {
  if (status !== 401 && status !== 403) return;
  if (tokenUsedForThisRequest === null) return;
  if (getAuthGeneration() !== generation || getAuthToken() !== tokenUsedForThisRequest) return;
  resetInMemoryToken();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SESSION_INVALID_EVENT));
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
  const generation = getAuthGeneration();
  const headers = new Headers(init?.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(buildApiUrl(path, params), { ...init, headers });
  init?.signal?.throwIfAborted();
  maybeInvalidateSession(res.status, token, generation);
  return res;
}

interface ApiGetOptions {
  signal?: AbortSignal;
  /** Require the versioned JSON transport and reject redirects or cache reuse. */
  strictJson?: boolean;
}

function requestSignal(caller?: AbortSignal): { signal: AbortSignal; dispose: () => void } {
  const timeoutController = new AbortController();
  // The browser support floor includes versions without these static methods.
  const nativeTimeout = typeof AbortSignal.timeout === "function";
  const timeout = nativeTimeout ? AbortSignal.timeout(5000) : timeoutController.signal;
  const timer = nativeTimeout ? undefined : setTimeout(() => {
    timeoutController.abort(new DOMException("Request deadline exceeded", "TimeoutError"));
  }, 5000);
  const disposeTimer = () => clearTimeout(timer);
  if (!caller) return { signal: timeout, dispose: disposeTimer };
  if (typeof AbortSignal.any === "function") {
    return { signal: AbortSignal.any([caller, timeout]), dispose: disposeTimer };
  }

  const controller = new AbortController();
  const cancel = () => controller.abort(caller.reason);
  const expire = () => controller.abort(timeout.reason);
  if (caller.aborted) cancel();
  else caller.addEventListener("abort", cancel, { once: true });
  if (timeout.aborted) expire();
  else timeout.addEventListener("abort", expire, { once: true });
  return {
    signal: controller.signal,
    dispose: () => {
      caller.removeEventListener("abort", cancel);
      timeout.removeEventListener("abort", expire);
      disposeTimer();
    },
  };
}

export async function apiRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  params?: Record<string, string | undefined>,
  options?: ApiGetOptions,
): Promise<T> {
  const { signal, dispose } = requestSignal(options?.signal);
  const init: RequestInit = { method, signal };
  if (options?.strictJson) {
    init.cache = "no-store";
    init.redirect = "error";
  }

  if (method === "POST" && body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  try {
    const res = await apiFetch(path, init, params);
    const mediaType = options?.strictJson
      ? res.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()
      : undefined;

    if (!res.ok) {
      let message = res.statusText;
      let problem: unknown;
      if (options?.strictJson && (res.status === 401 || res.status === 403)) {
        throw new ApiError(res.status, message);
      }
      try {
        if (!options?.strictJson || mediaType === "application/problem+json") {
          const data: unknown = await res.json();
          if (options?.strictJson) problem = data;
          else if ((data as ErrorBody)?.message) message = (data as ErrorBody).message!;
        }
      } catch {
        signal.throwIfAborted();
      }
      signal.throwIfAborted();
      throw new ApiError(res.status, message, problem);
    }

    if (options?.strictJson && (res.status !== 200 || mediaType !== "application/json")) {
      throw new ApiError(200, "Invalid JSON response metadata");
    }
    try {
      const payload = (await res.json()) as T;
      signal.throwIfAborted();
      return payload;
    } catch {
      signal.throwIfAborted();
      throw new ApiError(options?.strictJson ? res.status : 500, "Invalid JSON response from server");
    }
  } catch (error) {
    signal.throwIfAborted();
    throw error;
  } finally {
    dispose();
  }
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | undefined>,
  options?: ApiGetOptions,
): Promise<T> {
  return apiRequest<T>("GET", path, undefined, params, options);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  params?: Record<string, string | undefined>,
): Promise<T> {
  return apiRequest<T>("POST", path, body, params);
}
