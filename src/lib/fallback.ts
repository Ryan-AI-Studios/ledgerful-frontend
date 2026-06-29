import { ApiError } from "./api";

export function shouldUseMock(): boolean {
  const flag = process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  return flag === "true" || flag === "1";
}

export async function withFallback<T>(
  live: () => Promise<T>,
  mock: () => Promise<T>,
  options?: { notFoundReturns?: T },
): Promise<T> {
  if (shouldUseMock()) return mock();

  try {
    return await live();
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) {
        if (options && "notFoundReturns" in options) {
          return options.notFoundReturns as T;
        }
        return mock();
      }
      if (err.status >= 400) return mock();
    }
    if (err instanceof TypeError) return mock();
    if (err instanceof DOMException && err.name === "TimeoutError") return mock();
    throw err;
  }
}
