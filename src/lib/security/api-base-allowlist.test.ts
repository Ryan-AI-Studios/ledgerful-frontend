import { afterEach, describe, expect, it } from "vitest";
import {
  assertApiBaseAllowed,
  isLoopbackHost,
} from "./api-base-allowlist";

describe("isLoopbackHost", () => {
  it("accepts localhost and loopback IPs", () => {
    expect(isLoopbackHost("localhost")).toBe(true);
    expect(isLoopbackHost("127.0.0.1")).toBe(true);
    expect(isLoopbackHost("127.1.2.3")).toBe(true);
    expect(isLoopbackHost("::1")).toBe(true);
    expect(isLoopbackHost("[::1]")).toBe(true);
  });

  it("accepts IPv4-mapped IPv6 loopback (::ffff:127.0.0.0/8)", () => {
    expect(isLoopbackHost("::ffff:127.0.0.1")).toBe(true);
    expect(isLoopbackHost("[::ffff:127.0.0.1]")).toBe(true);
    expect(isLoopbackHost("::ffff:7f00:1")).toBe(true);
    expect(isLoopbackHost("0:0:0:0:0:ffff:127.0.0.1")).toBe(true);
  });

  it("rejects non-loopback hosts", () => {
    expect(isLoopbackHost("example.com")).toBe(false);
    expect(isLoopbackHost("192.168.1.1")).toBe(false);
    expect(isLoopbackHost("8.8.8.8")).toBe(false);
    expect(isLoopbackHost("::ffff:192.168.1.1")).toBe(false);
    expect(isLoopbackHost("[::ffff:c0a8:101]")).toBe(false);
  });
});

describe("assertApiBaseAllowed", () => {
  afterEach(() => {
    // pure functions — no env mutation to clean
  });

  it("passes when URL is unset", () => {
    expect(() => assertApiBaseAllowed(undefined, undefined)).not.toThrow();
    expect(() => assertApiBaseAllowed("", undefined)).not.toThrow();
  });

  it("passes for explicit loopback URLs", () => {
    expect(() =>
      assertApiBaseAllowed("http://127.0.0.1:52001", undefined),
    ).not.toThrow();
    expect(() =>
      assertApiBaseAllowed("http://localhost:52001", undefined),
    ).not.toThrow();
    expect(() =>
      assertApiBaseAllowed("http://[::1]:52001", undefined),
    ).not.toThrow();
    // IPv4-mapped IPv6 loopback — Rust IpAddr::is_loopback parity
    expect(() =>
      assertApiBaseAllowed("http://[::ffff:127.0.0.1]:52001", undefined),
    ).not.toThrow();
  });

  it("throws for non-loopback without ALLOW_REMOTE_DAEMON", () => {
    expect(() =>
      assertApiBaseAllowed("https://api.example.com", undefined),
    ).toThrow(/ALLOW_REMOTE_DAEMON=1/);
    expect(() =>
      assertApiBaseAllowed("https://api.example.com", undefined),
    ).toThrow(/non-loopback address/);
    expect(() =>
      assertApiBaseAllowed("https://api.example.com", "0"),
    ).toThrow(/ALLOW_REMOTE_DAEMON=1/);
  });

  it("passes for non-loopback when ALLOW_REMOTE_DAEMON=1", () => {
    expect(() =>
      assertApiBaseAllowed("https://api.example.com", "1"),
    ).not.toThrow();
  });

  it("throws for invalid URL", () => {
    expect(() => assertApiBaseAllowed("not a url", undefined)).toThrow(
      /not a valid URL/,
    );
  });
});
