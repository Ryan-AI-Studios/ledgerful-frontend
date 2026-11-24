import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, ApiError } from "./api";
import { SESSION_INVALID_EVENT } from "./events";
import { getAuthToken, resetInMemoryToken, setAuthToken } from "./utils";

const mockFetch = vi.fn();

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function invalidations(dispatch: ReturnType<typeof vi.fn>): Event[] {
  return dispatch.mock.calls
    .map(([event]) => event as Event)
    .filter((event) => event instanceof Event && event.type === SESSION_INVALID_EVENT);
}

/** Fetch aborts body reads with AbortError, even for a TimeoutError signal reason. */
function pendingJsonBody() {
  const started = deferred<void>();
  mockFetch.mockImplementationOnce(async (_url: string, { signal }: { signal: AbortSignal }) => ({
    ok: true,
    status: 200,
    headers: new Headers({ "Content-Type": "application/json" }),
    json: () => new Promise((_, reject) => {
      started.resolve();
      signal.addEventListener("abort", () => reject(new DOMException("Body cancelled", "AbortError")), { once: true });
    }),
  } satisfies Partial<Response>));
  return started.promise;
}

describe("shared API request lifecycle", () => {
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resetInMemoryToken();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
    dispatch = vi.fn();
    vi.stubGlobal("window", {
      location: { search: "", pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: dispatch,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("rejects promptly when a GET is superseded during response-body parsing", async () => {
    const started = pendingJsonBody();
    const caller = new AbortController();
    const request = apiGet("/evidence", undefined, { signal: caller.signal });
    const reason = new DOMException("Selection changed", "AbortError");
    const assertion = expect(request).rejects.toBe(reason);
    await started;
    caller.abort(reason);
    await assertion;
  });

  it("preserves caller abort and deadline timeout reasons", async () => {
    const timeoutController = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeoutController.signal);
    const caller = new AbortController();
    const callerRead = pendingJsonBody();
    const callerRequest = apiGet("/caller-abort", undefined, { signal: caller.signal });
    const callerReason = new DOMException("Superseded", "AbortError");
    const cancelled = expect(callerRequest).rejects.toBe(callerReason);
    await callerRead;
    caller.abort(callerReason);
    await cancelled;

    const timeoutRead = pendingJsonBody();
    const timeoutRequest = apiGet("/timeout");
    const timeoutReason = new DOMException("Request deadline exceeded", "TimeoutError");
    const timedOut = expect(timeoutRequest).rejects.toBe(timeoutReason);
    await timeoutRead;
    timeoutController.abort(timeoutReason);
    await timedOut;
  });

  it("keeps ordinary GET response and error behavior for callers without evidence options", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "Content-Type": "application/json" }),
      json: async () => ({ value: 7 }),
    } as Response);
    await expect(apiGet<{ value: number }>("/ordinary")).resolves.toEqual({ value: 7 });
    const init = mockFetch.mock.calls[0][1] as RequestInit;
    expect(init.cache).toBeUndefined();
    expect(init.redirect).toBeUndefined();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      statusText: "Unavailable",
      json: async () => ({ message: "legacy error parsing" }),
    } as Response);
    await expect(apiGet("/ordinary-error")).rejects.toMatchObject({
      status: 503,
      message: "legacy error parsing",
    } satisfies Partial<ApiError>);
  });

  it.each([401, 403])("does not invalidate a same-token newer auth generation after %i", async (status) => {
    setAuthToken("reused-token");
    let resolveFetch!: (response: Response) => void;
    mockFetch.mockReturnValueOnce(new Promise<Response>((resolve) => { resolveFetch = resolve; }));

    const request = apiGet("/stale-auth-response");
    // A logout/login cycle can reuse the token string; generation still changed.
    resetInMemoryToken();
    setAuthToken("reused-token");
    resolveFetch({
      ok: false,
      status,
      statusText: status === 401 ? "Unauthorized" : "Forbidden",
      json: async () => ({ message: "stale response" }),
    } as Response);

    await expect(request).rejects.toMatchObject({ status });
    expect(getAuthToken()).toBe("reused-token");
    expect(invalidations(dispatch)).toHaveLength(0);
  });
});
