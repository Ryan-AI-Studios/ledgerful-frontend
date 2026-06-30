import { ApiError } from "./api";

export type DataSource = "live" | "mock" | "stale" | "unavailable";

export interface WithSource<T> {
  data: T;
  source: DataSource;
}

export function shouldUseMock(): boolean {
  const flag = process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  return flag === "true" || flag === "1";
}

/**
 * Execute a live fetch and fall back to mock data when appropriate.
 *
 * Returns the data together with a provenance tag so the UI can never
 * silently present mock or unavailable data as live.
 *
 * Source semantics:
 * - "live"   — the live endpoint returned successfully.
 * - "mock"   — mock mode is enabled, or the live endpoint failed with a
 *              server error (>=500), network error, or timeout.
 * - "unavailable" — the live endpoint returned 404 and the caller provided
 *              an explicit `notFoundReturns` value (e.g. a single-item lookup).
 * - "stale"  — NOT set automatically by this helper; reserved for future
 *              cache-aware callers that want to mark cached data as stale.
 *
 * Auth and client errors (401, 403, and any non-404 4xx) are re-thrown so
 * they surface as real errors rather than being masked by mock data.
 */
export async function withFallback<T>(
  live: () => Promise<T>,
  mock: () => Promise<T>,
  options?: { notFoundReturns?: T },
): Promise<WithSource<T>> {
  if (shouldUseMock()) {
    return { data: await mock(), source: "mock" };
  }

  try {
    return { data: await live(), source: "live" };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404 && options && "notFoundReturns" in options) {
        return { data: options.notFoundReturns as T, source: "unavailable" };
      }
      if (err.status >= 500) {
        return { data: await mock(), source: "mock" };
      }
    }
    if (err instanceof TypeError) {
      return { data: await mock(), source: "mock" };
    }
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { data: await mock(), source: "mock" };
    }
    throw err;
  }
}
