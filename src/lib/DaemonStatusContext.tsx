"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { fetchStatus } from "./status-data";
import { isApiError, shouldUseMock } from "./fallback";
import {
  connectDaemonEvents,
  parseDaemonEventData,
  type SseTransportState,
} from "./sse";
import type { DaemonEvent } from "./types";
import { getAuthToken } from "./utils";

/** How daemon liveness is observed (DoD-3: fallback must be assertable). */
export type DaemonTransport = "sse" | "poll" | "idle";

export interface DaemonStatusContextType {
  isDaemonOffline: boolean;
  /** How status is observed: sse | poll | idle */
  transport: DaemonTransport;
  /** Latest `event: daemon` payload, when received over SSE. */
  latestEvent: DaemonEvent | null;
  /** Raw SSE client state (null when SSE was never started, e.g. mock mode). */
  sseState: SseTransportState | null;
}

const DaemonStatusContext = createContext<DaemonStatusContextType>({
  isDaemonOffline: false,
  transport: "idle",
  latestEvent: null,
  sseState: null,
});

const POLL_INTERVAL_MS = 60_000;
/**
 * Delay before treating sustained reconnect as offline.
 * Avoids GlobalOfflineBanner flash on brief stream drops while still
 * surfacing daemon death in a few seconds (DoD product goal vs 60s poll).
 */
const RECONNECT_OFFLINE_AFTER_MS = 5_000;

export function DaemonStatusProvider({ children }: { children: ReactNode }) {
  const [isDaemonOffline, setIsDaemonOffline] = useState(false);
  const [transport, setTransport] = useState<DaemonTransport>("idle");
  const [latestEvent, setLatestEvent] = useState<DaemonEvent | null>(null);
  const [sseState, setSseState] = useState<SseTransportState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let sseStop: (() => void) | null = null;
    let reconnectOfflineTimer: ReturnType<typeof setTimeout> | null = null;

    const clearPoll = () => {
      if (pollRef.current !== null) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    const clearReconnectOfflineTimer = () => {
      if (reconnectOfflineTimer !== null) {
        clearTimeout(reconnectOfflineTimer);
        reconnectOfflineTimer = null;
      }
    };

    const runPollOnce = async () => {
      try {
        // Connectivity-only: discard data/source; failures mean offline.
        await fetchStatus();
        if (!cancelled) setIsDaemonOffline(false);
      } catch (err) {
        if (cancelled) return;
        if (isApiError(err) && (err.status === 401 || err.status === 403)) {
          // Auth errors are not "daemon offline" — session invalid handles re-auth.
          setIsDaemonOffline(false);
        } else {
          setIsDaemonOffline(true);
        }
      }
    };

    const startPoll = () => {
      if (cancelled) return;
      clearPoll();
      setTransport("poll");
      void runPollOnce();
      pollRef.current = setInterval(() => {
        void runPollOnce();
      }, POLL_INTERVAL_MS);
    };

    // Mock mode: never open SSE (avoid hammering a missing stream).
    if (shouldUseMock()) {
      startPoll();
      return () => {
        cancelled = true;
        clearPoll();
      };
    }

    // No Bearer token yet: do not open SSE. An unauthenticated connect gets
    // 403 → auth_failed (permanent stop). This provider must mount only under
    // an authenticated ProjectProvider tree (see layout.tsx) so login remounts
    // us with a token. Guard stays as defense-in-depth.
    if (!getAuthToken()) {
      return () => {
        cancelled = true;
        clearPoll();
        clearReconnectOfflineTimer();
      };
    }

    // Live mode: exactly one SSE connection owned by this provider.
    // Initial transport/sseState stay at defaults ("idle"/null) until the
    // SSE client's onStateChange callback fires (avoid setState-in-effect).
    const handle = connectDaemonEvents({
      onEvent: (eventName, data) => {
        if (cancelled) return;
        if (eventName === "daemon") {
          const parsed = parseDaemonEventData(data);
          if (parsed) setLatestEvent(parsed);
        }
        // Any event proves the stream is live.
        clearReconnectOfflineTimer();
        setIsDaemonOffline(false);
        setTransport("sse");
      },
      onStateChange: (state) => {
        if (cancelled) return;
        setSseState(state);

        switch (state) {
          case "live":
            clearReconnectOfflineTimer();
            setIsDaemonOffline(false);
            setTransport("sse");
            clearPoll();
            break;
          case "connecting":
            // Initial connect: do not flip offline yet.
            break;
          case "reconnecting":
            // Do not set offline immediately (banner flash on brief drops).
            // After RECONNECT_OFFLINE_AFTER_MS of sustained reconnect, mark offline.
            // sseState still surfaces "reconnecting" for tests/debug.
            if (reconnectOfflineTimer === null) {
              reconnectOfflineTimer = setTimeout(() => {
                reconnectOfflineTimer = null;
                if (!cancelled) setIsDaemonOffline(true);
              }, RECONNECT_OFFLINE_AFTER_MS);
            }
            break;
          case "fallback":
            // Permanent: 404/405 or exhausted — observable poll fallback (DoD-3).
            // Poll probes will set offline if the daemon is actually down.
            // Clear latestEvent so dashboard/status stop overlaying a stale
            // SSE snapshot after the stream is gone (codex R2 P3).
            clearReconnectOfflineTimer();
            setLatestEvent(null);
            startPoll();
            break;
          case "auth_failed":
            // Same as poll path: auth is not "daemon offline".
            clearReconnectOfflineTimer();
            setIsDaemonOffline(false);
            setTransport("idle");
            clearPoll();
            break;
          case "stopped":
            clearReconnectOfflineTimer();
            clearPoll();
            break;
          default:
            break;
        }
      },
    });
    sseStop = handle.stop;

    return () => {
      cancelled = true;
      clearPoll();
      clearReconnectOfflineTimer();
      sseStop?.();
    };
  }, []);

  return (
    <DaemonStatusContext.Provider
      value={{ isDaemonOffline, transport, latestEvent, sseState }}
    >
      {children}
    </DaemonStatusContext.Provider>
  );
}

/** Boolean offline flag for GlobalOfflineBanner (stable API). */
export function useDaemonStatus(): boolean {
  const ctx = useContext(DaemonStatusContext);
  return ctx.isDaemonOffline;
}

/** Full status detail for tests and future consumers. */
export function useDaemonStatusDetail(): DaemonStatusContextType {
  return useContext(DaemonStatusContext);
}
