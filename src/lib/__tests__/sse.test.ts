import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseSseFrame,
  computeBackoffMs,
  connectDaemonEvents,
  parseDaemonEventData,
  SSE_BACKOFF_INITIAL_MS,
  SSE_BACKOFF_MAX_MS,
  type SseTransportState,
} from "../sse";
import { SESSION_INVALID_EVENT } from "../events";
import {
  getAuthToken,
  resetInMemoryToken,
  setAuthToken,
} from "../utils";

describe("parseSseFrame", () => {
  it("parses event + single data line", () => {
    const frame = parseSseFrame("event: daemon\ndata: {\"a\":1}");
    expect(frame).toEqual({
      event: "daemon",
      data: '{"a":1}',
    });
  });

  it("joins multi-line data with newline", () => {
    const frame = parseSseFrame("event: daemon\ndata: line1\ndata: line2");
    expect(frame).toEqual({
      event: "daemon",
      data: "line1\nline2",
    });
  });

  it("ignores comment / keep-alive lines", () => {
    const frame = parseSseFrame(": keep-alive\nevent: daemon\ndata: ok");
    expect(frame).toEqual({ event: "daemon", data: "ok" });
  });

  it("returns null for comment-only frames", () => {
    expect(parseSseFrame(": ping")).toBeNull();
    expect(parseSseFrame("")).toBeNull();
    expect(parseSseFrame("   ")).toBeNull();
  });

  it("parses id and retry fields", () => {
    const frame = parseSseFrame("id: 42\nretry: 3000\ndata: x");
    expect(frame).toEqual({
      event: "message",
      data: "x",
      id: "42",
      retry: 3000,
    });
  });

  it("strips single leading space after colon (SSE spec)", () => {
    const frame = parseSseFrame("data: hello");
    expect(frame?.data).toBe("hello");
  });

  it("defaults event to message when only data is present", () => {
    const frame = parseSseFrame("data: only");
    expect(frame).toEqual({ event: "message", data: "only" });
  });
});

describe("computeBackoffMs", () => {
  it("starts at 1s scale and doubles up to 30s ceiling", () => {
    // random=0 → exact base (upward jitter adds above base only)
    const base = (attempt: number) => computeBackoffMs(attempt, () => 0);
    expect(base(0)).toBe(SSE_BACKOFF_INITIAL_MS);
    expect(base(1)).toBe(2000);
    expect(base(2)).toBe(4000);
    expect(base(3)).toBe(8000);
    expect(base(4)).toBe(16000);
    expect(base(5)).toBe(SSE_BACKOFF_MAX_MS);
    expect(base(10)).toBe(SSE_BACKOFF_MAX_MS);
  });

  it("never exceeds the 30s ceiling even with max jitter", () => {
    for (let a = 0; a < 20; a++) {
      expect(computeBackoffMs(a, () => 1)).toBeLessThanOrEqual(SSE_BACKOFF_MAX_MS);
    }
  });

  it("stays within DoD-4 ≈6 attempts first minute (rate-limit budget)", () => {
    // Worst-case frequency = always-minimum delays (random=0 → base, never below).
    const minDelay = (attempt: number) => computeBackoffMs(attempt, () => 0);
    let elapsed = 0;
    let attempts = 0;
    while (elapsed < 60_000 && attempts < 100) {
      elapsed += minDelay(attempts);
      attempts += 1;
    }
    // 1+2+4+8+16+30 = 61s → 6 attempts in first ~60s
    expect(attempts).toBeLessThanOrEqual(6);
    expect(attempts).toBeGreaterThanOrEqual(5);
  });

  it("applies upward jitter in [base, base*1.25] and never below 1s initial", () => {
    expect(computeBackoffMs(0, () => 0)).toBe(1000);
    expect(computeBackoffMs(0, () => 1)).toBe(1250);
    expect(computeBackoffMs(1, () => 0)).toBe(2000);
    expect(computeBackoffMs(1, () => 1)).toBe(2500);
  });
});

describe("parseDaemonEventData", () => {
  it("parses a valid DaemonEvent", () => {
    expect(
      parseDaemonEventData(
        JSON.stringify({
          pendingTransactions: 1,
          unauditedDrift: 2,
          indexReady: true,
          graphReady: false,
        }),
      ),
    ).toEqual({
      pendingTransactions: 1,
      unauditedDrift: 2,
      indexReady: true,
      graphReady: false,
    });
  });

  it("returns null on malformed JSON or missing fields", () => {
    expect(parseDaemonEventData("not-json")).toBeNull();
    expect(parseDaemonEventData("{}")).toBeNull();
    expect(
      parseDaemonEventData(JSON.stringify({ pendingTransactions: 1 })),
    ).toBeNull();
  });
});

/** Build a ReadableStream that emits the given string chunks. */
function streamFromChunks(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i++]));
      } else {
        controller.close();
      }
    },
  });
}

function makeResponse(
  status: number,
  body: ReadableStream<Uint8Array> | null = null,
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    body,
    headers: new Headers(),
  } as Response;
}

describe("connectDaemonEvents", () => {
  const timers: Array<{ fn: () => void; ms: number; cleared: boolean }> = [];
  let fetchImpl: ReturnType<typeof vi.fn>;
  let states: SseTransportState[];
  let events: Array<{ name: string; data: string }>;
  let dispatchSpy: ReturnType<typeof vi.fn>;

  const flushTimers = () => {
    // Run all pending non-cleared timers once (in order scheduled)
    const pending = timers.filter((t) => !t.cleared);
    timers.length = 0;
    for (const t of pending) {
      t.fn();
    }
  };

  beforeEach(() => {
    resetInMemoryToken();
    timers.length = 0;
    states = [];
    events = [];
    fetchImpl = vi.fn();
    dispatchSpy = vi.fn();
    vi.stubGlobal("window", {
      location: { search: "", pathname: "/", hash: "" },
      history: { replaceState: vi.fn() },
      dispatchEvent: dispatchSpy,
    });
  });

  afterEach(() => {
    resetInMemoryToken();
    vi.unstubAllGlobals();
  });

  const schedule = (fn: () => void, ms: number) => {
    const entry = { fn, ms, cleared: false };
    timers.push(entry);
    return {
      clear: () => {
        entry.cleared = true;
      },
    };
  };

  it("sends Authorization header and never puts the token in the URL (DoD-2)", async () => {
    setAuthToken("secret-token-xyz");
    const urlUsed = "http://127.0.0.1:52001/api/events";
    fetchImpl.mockResolvedValueOnce(
      makeResponse(200, streamFromChunks(["event: daemon\ndata: {}\n\n"])),
    );

    const { stop } = connectDaemonEvents({
      onEvent: (name, data) => events.push({ name, data }),
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => getAuthToken(),
      buildUrl: () => urlUsed,
      schedule,
      random: () => 1,
      stableAfterMs: 50,
    });

    await vi.waitFor(() => {
      expect(fetchImpl).toHaveBeenCalled();
    });

    const [calledUrl, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe(urlUsed);
    expect(calledUrl).not.toContain("secret-token");
    expect(calledUrl).not.toContain("token=");
    expect(new URL(calledUrl).search).toBe("");
    const auth = new Headers(init.headers as HeadersInit).get("Authorization");
    expect(auth).toBe("Bearer secret-token-xyz");

    stop();
  });

  it("parses frames split across chunk boundaries", async () => {
    // Frame deliberately split mid-field and across the blank-line delimiter
    const chunks = [
      "event: dae",
      "mon\ndata: {\"pendingTransactions\":1,\"unauditedDrift\":0,\"indexReady\":true,\"graphReady\":true}",
      "\n\n",
      ": keep-alive\n\n",
      "event: daemon\ndata: lineA\ndata: lineB\n\n",
    ];
    fetchImpl.mockResolvedValueOnce(makeResponse(200, streamFromChunks(chunks)));

    const { stop } = connectDaemonEvents({
      onEvent: (name, data) => events.push({ name, data }),
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => "t",
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule,
      random: () => 1,
      stableAfterMs: 60_000, // stability via event, not timer
    });

    await vi.waitFor(() => {
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    expect(events[0]).toEqual({
      name: "daemon",
      data: '{"pendingTransactions":1,"unauditedDrift":0,"indexReady":true,"graphReady":true}',
    });
    expect(events[1]).toEqual({
      name: "daemon",
      data: "lineA\nlineB",
    });
    // Keep-alive produced no event
    expect(events).toHaveLength(2);

    stop();
  });

  it("parses CRLF-delimited SSE frames", async () => {
    const chunks = [
      "event: daemon\r\ndata: {\"pendingTransactions\":2,\"unauditedDrift\":0,\"indexReady\":true,\"graphReady\":true}\r\n\r\n",
      ": keep-alive\r\n\r\n",
      "event: daemon\r\ndata: second\r\n\r\n",
    ];
    fetchImpl.mockResolvedValueOnce(makeResponse(200, streamFromChunks(chunks)));

    const { stop } = connectDaemonEvents({
      onEvent: (name, data) => events.push({ name, data }),
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => "t",
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule,
      random: () => 1,
      stableAfterMs: 60_000,
    });

    await vi.waitFor(() => {
      expect(events.length).toBeGreaterThanOrEqual(2);
    });

    expect(events[0]?.name).toBe("daemon");
    expect(events[0]?.data).toContain('"pendingTransactions":2');
    expect(events[1]).toEqual({ name: "daemon", data: "second" });
    expect(events).toHaveLength(2);
    stop();
  });

  it("stops on 403, invalidates session, does not reconnect (DoD-4)", async () => {
    setAuthToken("dead-token");
    fetchImpl.mockResolvedValueOnce(makeResponse(403));

    const { stop } = connectDaemonEvents({
      onEvent: (name, data) => events.push({ name, data }),
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => getAuthToken(),
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule,
      random: () => 1,
    });

    await vi.waitFor(() => {
      expect(states).toContain("auth_failed");
    });

    expect(getAuthToken()).toBeNull();
    const invalidEvents = dispatchSpy.mock.calls
      .map((c) => c[0] as Event)
      .filter((e) => e instanceof Event && e.type === SESSION_INVALID_EVENT);
    expect(invalidEvents).toHaveLength(1);

    // No reconnect timer scheduled after auth failure
    const reconnectTimers = timers.filter((t) => !t.cleared);
    expect(reconnectTimers).toHaveLength(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    stop();
  });

  it("permanently falls back on 404 without retry", async () => {
    fetchImpl.mockResolvedValueOnce(makeResponse(404));

    const { stop } = connectDaemonEvents({
      onEvent: (name, data) => events.push({ name, data }),
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => "t",
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule,
      random: () => 1,
    });

    await vi.waitFor(() => {
      expect(states).toContain("fallback");
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(timers.filter((t) => !t.cleared)).toHaveLength(0);

    stop();
  });

  it("permanently falls back on 405 without retry", async () => {
    fetchImpl.mockResolvedValueOnce(makeResponse(405));

    const { stop } = connectDaemonEvents({
      onEvent: () => undefined,
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => "t",
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule,
      random: () => 1,
    });

    await vi.waitFor(() => {
      expect(states).toContain("fallback");
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    stop();
  });

  it("does not reset backoff on flapping accept-then-drop without stable event (DoD-4)", async () => {
    // Each connection: 200 + empty stream that ends immediately (no events, no stable duration)
    fetchImpl.mockImplementation(() =>
      Promise.resolve(makeResponse(200, streamFromChunks([]))),
    );

    const delays: number[] = [];
    const trackingSchedule = (fn: () => void, ms: number) => {
      delays.push(ms);
      return schedule(fn, ms);
    };

    const { stop } = connectDaemonEvents({
      onEvent: () => undefined,
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => "t",
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule: trackingSchedule,
      random: () => 0, // exact base delays: 1000, 2000, 4000, ...
      stableAfterMs: 60_000, // never reaches stability via timer in this test
      maxUnstableFailures: 5,
    });

    // Drive several flap cycles: connect → empty stream ends → reconnect timer.
    // Ignore stableAfterMs timers (60s); only reconnect delays are < 60s.
    for (let i = 0; i < 4; i++) {
      await vi.waitFor(() => {
        expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(i + 1);
      });
      // Wait until the reconnect delay for this cycle is scheduled (not the stable timer).
      await vi.waitFor(() => {
        expect(delays.filter((d) => d < 60_000).length).toBeGreaterThanOrEqual(i + 1);
      });
      const pending = timers.filter((t) => !t.cleared && t.ms < 60_000);
      for (const t of pending) {
        t.cleared = true;
        t.fn();
      }
    }

    // Backoff must have increased: 1000, 2000, 4000, 8000 (not reset to 1000 each time)
    const reconnectDelays = delays.filter((d) => d < 60_000);
    expect(reconnectDelays.length).toBeGreaterThanOrEqual(3);
    expect(reconnectDelays[0]).toBe(1000);
    expect(reconnectDelays[1]).toBe(2000);
    expect(reconnectDelays[2]).toBe(4000);

    stop();
  });

  it("resets backoff after a received event proves stability", async () => {
    let call = 0;
    fetchImpl.mockImplementation(() => {
      call += 1;
      if (call === 1) {
        // First: accept and immediately end (unstable)
        return Promise.resolve(makeResponse(200, streamFromChunks([])));
      }
      if (call === 2) {
        // Second: deliver an event (stable), then end
        return Promise.resolve(
          makeResponse(
            200,
            streamFromChunks([
              'event: daemon\ndata: {"pendingTransactions":0,"unauditedDrift":0,"indexReady":true,"graphReady":true}\n\n',
            ]),
          ),
        );
      }
      // Third: flap again — backoff should restart at 1s because event reset it
      return Promise.resolve(makeResponse(200, streamFromChunks([])));
    });

    const delays: number[] = [];
    const trackingSchedule = (fn: () => void, ms: number) => {
      delays.push(ms);
      return schedule(fn, ms);
    };

    const { stop } = connectDaemonEvents({
      onEvent: (name, data) => events.push({ name, data }),
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => "t",
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule: trackingSchedule,
      random: () => 0, // exact base delays
      stableAfterMs: 60_000,
      maxUnstableFailures: 10,
    });

    // Cycle 1: flap → reconnect at 1000
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(delays.filter((d) => d < 60_000).length).toBe(1));
    flushTimers();

    // Cycle 2: event received → stream ends → reconnect should be 1000 again (reset)
    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(events.length).toBe(1));
    await vi.waitFor(() => expect(delays.filter((d) => d < 60_000).length).toBe(2));

    const reconnectDelays = delays.filter((d) => d < 60_000);
    expect(reconnectDelays[0]).toBe(1000);
    // After event, attempt was reset → next reconnect is also 1000
    expect(reconnectDelays[1]).toBe(1000);

    stop();
  });

  it("stop() aborts and ends in stopped state", async () => {
    let abortSignal: AbortSignal | undefined;
    fetchImpl.mockImplementation((_url: string, init?: RequestInit) => {
      abortSignal = init?.signal ?? undefined;
      return new Promise(() => {
        // never resolves
      });
    });

    const { stop } = connectDaemonEvents({
      onEvent: () => undefined,
      onStateChange: (s) => states.push(s),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      getToken: () => "t",
      buildUrl: () => "http://127.0.0.1:52001/api/events",
      schedule,
      random: () => 1,
    });

    await vi.waitFor(() => expect(fetchImpl).toHaveBeenCalled());
    stop();
    expect(states).toContain("stopped");
    expect(abortSignal?.aborted).toBe(true);
  });
});
