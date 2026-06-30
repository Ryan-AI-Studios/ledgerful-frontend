import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { withFallback, shouldUseMock, WithSource } from "../fallback";
import { ApiError } from "../api";

describe("shouldUseMock", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  it("returns true when the env var is 'true'", () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "true";
    expect(shouldUseMock()).toBe(true);
  });

  it("returns true when the env var is '1'", () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "1";
    expect(shouldUseMock()).toBe(true);
  });

  it("returns false otherwise", () => {
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
    expect(shouldUseMock()).toBe(false);
  });
});

describe("withFallback", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  it("returns mock data with source=mock when mock mode is enabled", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "true";
    const live = vi.fn().mockRejectedValue(new Error("should not be called"));
    const mock = vi.fn().mockResolvedValue({ value: 42 });

    const result = await withFallback(live, mock);
    expect(result).toEqual<WithSource<{ value: number }>>({ data: { value: 42 }, source: "mock" });
    expect(live).not.toHaveBeenCalled();
  });

  it("returns live data with source=live on success", async () => {
    const live = vi.fn().mockResolvedValue({ value: 1 });
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    const result = await withFallback(live, mock);
    expect(result).toEqual<WithSource<{ value: number }>>({ data: { value: 1 }, source: "live" });
    expect(mock).not.toHaveBeenCalled();
  });

  it("falls back to mock with source=mock on server error (>=500)", async () => {
    const live = vi.fn().mockRejectedValue(new ApiError(503, "unavailable"));
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    const result = await withFallback(live, mock);
    expect(result.source).toBe("mock");
    expect(result.data).toEqual({ value: 2 });
  });

  it("falls back to mock with source=mock on network TypeError", async () => {
    const live = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    const result = await withFallback(live, mock);
    expect(result.source).toBe("mock");
    expect(result.data).toEqual({ value: 2 });
  });

  it("falls back to mock with source=mock on timeout DOMException", async () => {
    const err = new DOMException("Timeout", "TimeoutError");
    const live = vi.fn().mockRejectedValue(err);
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    const result = await withFallback(live, mock);
    expect(result.source).toBe("mock");
    expect(result.data).toEqual({ value: 2 });
  });

  it("throws on 401 and does not return mock", async () => {
    const live = vi.fn().mockRejectedValue(new ApiError(401, "bad token"));
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    await expect(withFallback(live, mock)).rejects.toThrow("bad token");
    expect(mock).not.toHaveBeenCalled();
  });

  it("throws on 403 and does not return mock", async () => {
    const live = vi.fn().mockRejectedValue(new ApiError(403, "forbidden"));
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    await expect(withFallback(live, mock)).rejects.toThrow("forbidden");
    expect(mock).not.toHaveBeenCalled();
  });

  it("throws on non-404 4xx errors and does not return mock", async () => {
    const live = vi.fn().mockRejectedValue(new ApiError(422, "unprocessable"));
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    await expect(withFallback(live, mock)).rejects.toThrow("unprocessable");
    expect(mock).not.toHaveBeenCalled();
  });

  it("returns notFoundReturns with source=unavailable on 404 when option is provided", async () => {
    const live = vi.fn().mockRejectedValue(new ApiError(404, "not found"));
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    const result = await withFallback(live, mock, { notFoundReturns: undefined });
    expect(result.source).toBe("unavailable");
    expect(result.data).toBeUndefined();
    expect(mock).not.toHaveBeenCalled();
  });

  it("throws on 404 when notFoundReturns option is absent", async () => {
    const live = vi.fn().mockRejectedValue(new ApiError(404, "not found"));
    const mock = vi.fn().mockResolvedValue({ value: 2 });

    await expect(withFallback(live, mock)).rejects.toThrow("not found");
    expect(mock).not.toHaveBeenCalled();
  });
});
