import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  readHandoffCode,
  isSameOriginApiBase,
  clearHandoffHash,
  takeHandoffCodeFromLocation,
  exchangeHandoffCode,
  shouldBootstrapHandoff,
  beginHandoffExchange,
  resetHandoffExchangeState,
  HANDOFF_FAILED_MESSAGE,
} from "../session-handoff";
import { getAuthToken, resetInMemoryToken, setAuthToken } from "../utils";

const HANDOFF_CODE = "a".repeat(64);
const SESSION_TOKEN = "b".repeat(64);
const SHORT_HEX = "AbCdEf0123456789";

describe("session-handoff", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;

  beforeEach(() => {
    resetInMemoryToken();
    resetHandoffExchangeState();
    delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    resetInMemoryToken();
    resetHandoffExchangeState();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
    } else {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = originalApiUrl;
    }
    window.history.replaceState(null, "", "/");
  });

  describe("readHandoffCode", () => {
    it("returns hex code from #c=<64-hex>", () => {
      window.location.hash = `#c=${HANDOFF_CODE}`;
      expect(readHandoffCode()).toBe(HANDOFF_CODE);
    });

    it("accepts mixed-case 64-char hex", () => {
      const mixed = ("AbCdEf0123456789".repeat(4)).slice(0, 64);
      window.location.hash = `#c=${mixed}`;
      expect(readHandoffCode()).toBe(mixed);
    });

    it("returns null when hash is missing", () => {
      window.location.hash = "";
      expect(readHandoffCode()).toBeNull();
    });

    it("returns null for non-hex payload", () => {
      window.location.hash = "#c=not-hex!!";
      expect(readHandoffCode()).toBeNull();
    });

    it("returns null for wrong fragment key", () => {
      window.location.hash = `#token=${HANDOFF_CODE}`;
      expect(readHandoffCode()).toBeNull();
    });

    it("returns null for query-style code (not fragment)", () => {
      window.history.replaceState(null, "", `/?c=${HANDOFF_CODE}`);
      expect(readHandoffCode()).toBeNull();
    });

    it("returns null for short hex (not exactly 64 chars)", () => {
      window.location.hash = `#c=${SHORT_HEX}`;
      expect(readHandoffCode()).toBeNull();
    });

    it("returns null for 63-char hex", () => {
      window.location.hash = `#c=${"a".repeat(63)}`;
      expect(readHandoffCode()).toBeNull();
    });

    it("returns null for 65-char hex", () => {
      window.location.hash = `#c=${"a".repeat(65)}`;
      expect(readHandoffCode()).toBeNull();
    });
  });

  describe("isSameOriginApiBase", () => {
    it("returns true when API base origin matches window.location.origin", () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      expect(isSameOriginApiBase()).toBe(true);
    });

    it("returns false when API base is cross-origin (default daemon vs jsdom host)", () => {
      // Default base is http://127.0.0.1:52001; jsdom is typically http://localhost:3000
      delete process.env.NEXT_PUBLIC_LEDGERFUL_API_URL;
      expect(isSameOriginApiBase()).toBe(false);
    });

    it("returns false for an explicit remote API base", () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = "https://api.example.com";
      expect(isSameOriginApiBase()).toBe(false);
    });
  });

  describe("takeHandoffCodeFromLocation / clearHandoffHash", () => {
    it("strips the hash via replaceState and returns the code", () => {
      window.location.hash = `#c=${HANDOFF_CODE}`;
      const replaceSpy = vi.spyOn(window.history, "replaceState");

      const code = takeHandoffCodeFromLocation();

      expect(code).toBe(HANDOFF_CODE);
      expect(replaceSpy).toHaveBeenCalled();
      expect(window.location.hash).toBe("");
    });

    it("does not call replaceState when no handoff code is present", () => {
      window.location.hash = "";
      const replaceSpy = vi.spyOn(window.history, "replaceState");

      expect(takeHandoffCodeFromLocation()).toBeNull();
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    it("clearHandoffHash removes only the fragment", () => {
      window.history.replaceState(null, "", `/dashboard?x=1#c=${HANDOFF_CODE}`);
      clearHandoffHash();
      expect(window.location.hash).toBe("");
      expect(window.location.pathname + window.location.search).toBe(
        "/dashboard?x=1",
      );
    });
  });

  describe("exchangeHandoffCode", () => {
    it("POSTs code in JSON body only; never in the request URL", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ token: SESSION_TOKEN }),
      } as Response);
      global.fetch = mockFetch;

      const result = await exchangeHandoffCode(HANDOFF_CODE);

      expect(result).toEqual({ token: SESSION_TOKEN });
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toMatch(/\/api\/session\/exchange$/);
      expect(url).not.toContain(HANDOFF_CODE);
      expect(url).not.toContain(SESSION_TOKEN);
      expect(url).not.toContain("?");
      expect(init.method).toBe("POST");
      expect(init.body).toBe(JSON.stringify({ code: HANDOFF_CODE }));
      // No Authorization on bootstrap exchange
      const headers = new Headers(init.headers);
      expect(headers.get("Authorization")).toBeNull();
    });

    it("does not put code or token in URL on 403 failure", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ message: "forbidden" }),
      } as Response);
      global.fetch = mockFetch;

      await expect(exchangeHandoffCode(HANDOFF_CODE)).rejects.toMatchObject({
        status: 403,
      });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain(HANDOFF_CODE);
      expect(url).not.toContain("?");
    });
  });

  describe("shouldBootstrapHandoff", () => {
    it("is true only for same-origin + hash + no token", () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      window.location.hash = `#c=${HANDOFF_CODE}`;
      expect(shouldBootstrapHandoff()).toBe(true);
    });

    it("is false when a token is already present", () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      window.location.hash = `#c=${HANDOFF_CODE}`;
      setAuthToken(SESSION_TOKEN);
      expect(shouldBootstrapHandoff()).toBe(false);
      expect(getAuthToken()).toBe(SESSION_TOKEN);
    });

    it("is false for cross-origin API base even with hash", () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = "https://evil.example";
      window.location.hash = `#c=${HANDOFF_CODE}`;
      expect(shouldBootstrapHandoff()).toBe(false);
    });

    it("is true while an exchange is in flight even after hash is stripped", async () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      window.location.hash = `#c=${HANDOFF_CODE}`;

      let resolveFetch!: (value: Response) => void;
      const pending = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      global.fetch = vi.fn(() => pending);

      const p = beginHandoffExchange();
      expect(p).not.toBeNull();
      expect(window.location.hash).toBe("");
      expect(shouldBootstrapHandoff()).toBe(true);

      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({ token: SESSION_TOKEN }),
      } as Response);
      await p;
      expect(shouldBootstrapHandoff()).toBe(false);
    });
  });

  describe("beginHandoffExchange", () => {
    it("returns null when no hash and no token", () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      window.location.hash = "";
      expect(beginHandoffExchange()).toBeNull();
    });

    it("resolves immediately when a token is already stored", async () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      setAuthToken(SESSION_TOKEN);
      const p = beginHandoffExchange();
      expect(p).not.toBeNull();
      await expect(p!).resolves.toBe(SESSION_TOKEN);
    });

    it("strips hash, exchanges once, and sets auth token at module level", async () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      window.location.hash = `#c=${HANDOFF_CODE}`;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ token: SESSION_TOKEN }),
      } as Response);

      const token = await beginHandoffExchange();
      expect(token).toBe(SESSION_TOKEN);
      expect(getAuthToken()).toBe(SESSION_TOKEN);
      expect(window.location.hash).toBe("");
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("joins the same in-flight promise after hash is stripped (remount)", async () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      window.location.hash = `#c=${HANDOFF_CODE}`;

      let resolveFetch!: (value: Response) => void;
      const pending = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      global.fetch = vi.fn(() => pending);

      const first = beginHandoffExchange();
      expect(first).not.toBeNull();
      expect(window.location.hash).toBe("");
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call after strip: joins inflight, does not start another exchange
      const second = beginHandoffExchange();
      expect(second).toBe(first);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({ token: SESSION_TOKEN }),
      } as Response);

      await expect(first!).resolves.toBe(SESSION_TOKEN);
      await expect(second!).resolves.toBe(SESSION_TOKEN);
      expect(getAuthToken()).toBe(SESSION_TOKEN);
    });

    it("returns null for cross-origin API base", () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = "https://api.example.com";
      window.location.hash = `#c=${HANDOFF_CODE}`;
      expect(beginHandoffExchange()).toBeNull();
      expect(window.location.hash).toBe(`#c=${HANDOFF_CODE}`);
    });
  });

  describe("HANDOFF_FAILED_MESSAGE", () => {
    it("is a non-empty explanatory string", () => {
      expect(HANDOFF_FAILED_MESSAGE).toMatch(/Automatic sign-in expired/i);
      expect(HANDOFF_FAILED_MESSAGE).toMatch(/web-session-token/);
    });
  });

  describe("ordering: replaceState before exchange await", () => {
    it("calls replaceState before the exchange fetch promise resolves", async () => {
      process.env.NEXT_PUBLIC_LEDGERFUL_API_URL = window.location.origin;
      window.location.hash = `#c=${HANDOFF_CODE}`;

      const order: string[] = [];
      const replaceSpy = vi
        .spyOn(window.history, "replaceState")
        .mockImplementation(function (
          this: History,
          data: unknown,
          unused: string,
          url?: string | URL | null,
        ) {
          order.push("replaceState");
          return History.prototype.replaceState.call(this, data, unused, url);
        });

      let resolveFetch!: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });
      global.fetch = vi.fn(() => {
        order.push("fetch");
        return fetchPromise;
      });

      // Synchronous take: must strip before caller awaits exchange
      const code = takeHandoffCodeFromLocation();
      expect(code).toBe(HANDOFF_CODE);
      expect(order).toEqual(["replaceState"]);
      expect(replaceSpy).toHaveBeenCalled();

      const exchangePromise = exchangeHandoffCode(code!);
      expect(order).toEqual(["replaceState", "fetch"]);

      resolveFetch({
        ok: true,
        status: 200,
        json: async () => ({ token: SESSION_TOKEN }),
      } as Response);

      await expect(exchangePromise).resolves.toEqual({ token: SESSION_TOKEN });
      // replaceState index still strictly before fetch
      expect(order.indexOf("replaceState")).toBeLessThan(order.indexOf("fetch"));
    });
  });
});
