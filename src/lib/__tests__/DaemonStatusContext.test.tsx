import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import type { SseTransportState, ConnectSseOptions } from "../sse";
import { resetInMemoryToken, setAuthToken } from "../utils";

const connectMock = vi.fn();
const fetchStatusMock = vi.fn();

vi.mock("../sse", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../sse")>();
  return {
    ...actual,
    connectDaemonEvents: (...args: unknown[]) => connectMock(...args),
  };
});

vi.mock("../status-data", () => ({
  fetchStatus: (...args: unknown[]) => fetchStatusMock(...args),
}));

describe("DaemonStatusContext", () => {
  beforeEach(() => {
    connectMock.mockReset();
    fetchStatusMock.mockReset();
    resetInMemoryToken();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
  });

  afterEach(() => {
    resetInMemoryToken();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK;
    vi.useRealTimers();
  });

  function installConnectCapture() {
    let options: ConnectSseOptions | null = null;
    const stop = vi.fn();
    connectMock.mockImplementation((opts: ConnectSseOptions) => {
      options = opts;
      return { stop };
    });
    return {
      getOptions: () => options as ConnectSseOptions,
      stop,
      emitState: (state: SseTransportState) => {
        act(() => {
          options?.onStateChange?.(state);
        });
      },
      emitEvent: (name: string, data: string) => {
        act(() => {
          options?.onEvent(name, data);
        });
      },
    };
  }

  it("does not open SSE without an auth token (avoids permanent auth_failed)", async () => {
    // No setAuthToken — cold load / TokenPrompt still visible.
    const { DaemonStatusProvider, useDaemonStatusDetail } = await import(
      "../DaemonStatusContext"
    );

    function Probe() {
      const d = useDaemonStatusDetail();
      return (
        <div>
          <span data-testid="transport">{d.transport}</span>
          <span data-testid="sse">{d.sseState ?? "null"}</span>
        </div>
      );
    }

    render(
      <DaemonStatusProvider>
        <Probe />
      </DaemonStatusProvider>,
    );

    expect(connectMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("transport").textContent).toBe("idle");
    expect(screen.getByTestId("sse").textContent).toBe("null");
  });

  it("clears latestEvent when falling back to poll (no stale SSE overlay)", async () => {
    setAuthToken("test-token");
    const cap = installConnectCapture();
    fetchStatusMock.mockResolvedValue({
      data: {
        indexReady: true,
        graphReady: true,
        pendingTransactions: 0,
        unauditedDrift: 0,
        embeddingModelReachable: true,
        completionModelReachable: true,
      },
      source: "live",
    });

    const { DaemonStatusProvider, useDaemonStatusDetail } = await import(
      "../DaemonStatusContext"
    );

    function Probe() {
      const d = useDaemonStatusDetail();
      return (
        <div>
          <span data-testid="pending">
            {d.latestEvent?.pendingTransactions ?? "none"}
          </span>
          <span data-testid="transport">{d.transport}</span>
        </div>
      );
    }

    render(
      <DaemonStatusProvider>
        <Probe />
      </DaemonStatusProvider>,
    );

    cap.emitState("live");
    cap.emitEvent(
      "daemon",
      JSON.stringify({
        pendingTransactions: 9,
        unauditedDrift: 2,
        indexReady: true,
        graphReady: true,
      }),
    );
    expect(screen.getByTestId("pending").textContent).toBe("9");

    cap.emitState("fallback");
    await waitFor(() => {
      expect(screen.getByTestId("transport").textContent).toBe("poll");
    });
    expect(screen.getByTestId("pending").textContent).toBe("none");
  });

  it("falls back to poll on SSE 404/fallback and exposes transport (DoD-3)", async () => {
    setAuthToken("test-token");
    const cap = installConnectCapture();
    fetchStatusMock.mockResolvedValue({
      data: {
        indexReady: true,
        graphReady: true,
        pendingTransactions: 0,
        unauditedDrift: 0,
        embeddingModelReachable: true,
        completionModelReachable: true,
      },
      source: "live",
    });

    const { DaemonStatusProvider, useDaemonStatusDetail } = await import(
      "../DaemonStatusContext"
    );

    function Probe() {
      const d = useDaemonStatusDetail();
      return (
        <div>
          <span data-testid="offline">{String(d.isDaemonOffline)}</span>
          <span data-testid="transport">{d.transport}</span>
          <span data-testid="sse">{d.sseState ?? "null"}</span>
        </div>
      );
    }

    render(
      <DaemonStatusProvider>
        <Probe />
      </DaemonStatusProvider>,
    );

    expect(connectMock).toHaveBeenCalledTimes(1);

    // Simulate permanent fallback (404 path inside sse client)
    cap.emitState("fallback");

    await waitFor(() => {
      expect(screen.getByTestId("transport").textContent).toBe("poll");
    });
    expect(fetchStatusMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("offline").textContent).toBe("false");
    });
    expect(screen.getByTestId("sse").textContent).toBe("fallback");
  });

  it("does not flash offline on brief reconnect; marks offline after delay", async () => {
    setAuthToken("test-token");
    vi.useFakeTimers();
    const cap = installConnectCapture();

    const { DaemonStatusProvider, useDaemonStatusDetail } = await import(
      "../DaemonStatusContext"
    );

    function Probe() {
      const d = useDaemonStatusDetail();
      return (
        <div>
          <span data-testid="offline">{String(d.isDaemonOffline)}</span>
          <span data-testid="transport">{d.transport}</span>
          <span data-testid="sse">{d.sseState ?? "null"}</span>
        </div>
      );
    }

    render(
      <DaemonStatusProvider>
        <Probe />
      </DaemonStatusProvider>,
    );

    cap.emitState("live");
    expect(screen.getByTestId("offline").textContent).toBe("false");
    expect(screen.getByTestId("transport").textContent).toBe("sse");

    // Immediate reconnect: stay online (no banner flash).
    cap.emitState("reconnecting");
    expect(screen.getByTestId("offline").textContent).toBe("false");
    expect(screen.getByTestId("sse").textContent).toBe("reconnecting");

    // Brief recovery before the delay elapses.
    cap.emitState("live");
    expect(screen.getByTestId("offline").textContent).toBe("false");

    // Sustained reconnect past threshold → offline.
    cap.emitState("reconnecting");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(screen.getByTestId("offline").textContent).toBe("true");

    cap.emitState("live");
    expect(screen.getByTestId("offline").textContent).toBe("false");
  });

  it("stores latest daemon event payload", async () => {
    setAuthToken("test-token");
    const cap = installConnectCapture();

    const { DaemonStatusProvider, useDaemonStatusDetail } = await import(
      "../DaemonStatusContext"
    );

    function Probe() {
      const d = useDaemonStatusDetail();
      return (
        <div>
          <span data-testid="pending">
            {d.latestEvent?.pendingTransactions ?? "none"}
          </span>
        </div>
      );
    }

    render(
      <DaemonStatusProvider>
        <Probe />
      </DaemonStatusProvider>,
    );

    cap.emitState("live");
    cap.emitEvent(
      "daemon",
      JSON.stringify({
        pendingTransactions: 3,
        unauditedDrift: 1,
        indexReady: true,
        graphReady: true,
      }),
    );

    expect(screen.getByTestId("pending").textContent).toBe("3");
  });

  it("does not open SSE in mock mode; uses poll transport", async () => {
    process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK = "true";
    fetchStatusMock.mockResolvedValue({
      data: {
        indexReady: true,
        graphReady: true,
        pendingTransactions: 0,
        unauditedDrift: 0,
        embeddingModelReachable: true,
        completionModelReachable: true,
      },
      source: "mock",
    });

    const { DaemonStatusProvider, useDaemonStatusDetail } = await import(
      "../DaemonStatusContext"
    );

    function Probe() {
      const d = useDaemonStatusDetail();
      return <span data-testid="transport">{d.transport}</span>;
    }

    render(
      <DaemonStatusProvider>
        <Probe />
      </DaemonStatusProvider>,
    );

    expect(connectMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByTestId("transport").textContent).toBe("poll");
    });
    expect(fetchStatusMock).toHaveBeenCalled();
  });

  it("auth_failed keeps isDaemonOffline false", async () => {
    setAuthToken("test-token");
    const cap = installConnectCapture();

    const { DaemonStatusProvider, useDaemonStatus } = await import(
      "../DaemonStatusContext"
    );

    function Probe() {
      const offline = useDaemonStatus();
      return <span data-testid="offline">{String(offline)}</span>;
    }

    render(
      <DaemonStatusProvider>
        <Probe />
      </DaemonStatusProvider>,
    );

    cap.emitState("live");
    cap.emitState("auth_failed");
    expect(screen.getByTestId("offline").textContent).toBe("false");
  });

  it("stops SSE on unmount", async () => {
    setAuthToken("test-token");
    const cap = installConnectCapture();

    const { DaemonStatusProvider } = await import("../DaemonStatusContext");

    const { unmount } = render(
      <DaemonStatusProvider>
        <div>child</div>
      </DaemonStatusProvider>,
    );

    unmount();
    expect(cap.stop).toHaveBeenCalled();
  });
});
