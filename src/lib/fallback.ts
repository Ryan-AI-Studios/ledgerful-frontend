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
      if (err.status === 404 && options && "notFoundReturns" in options) {
        return options.notFoundReturns as T;
      }
      if (err.status >= 500) return mock();
    }
    if (err instanceof TypeError) return mock();
    throw err;
  }
}
