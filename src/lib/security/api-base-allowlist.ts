/**
 * Build-time loopback allowlist for NEXT_PUBLIC_LEDGERFUL_API_URL (FE-A3).
 *
 * Host matching mirrors the engine's `is_loopback_host` (middleware.rs):
 * localhost, IPv4 loopback (127.0.0.0/8), IPv6 loopback (::1), with `[]`
 * stripped from IPv6 literals before parse.
 */

import { isIPv4, isIPv6 } from "node:net";

/**
 * True when `host` is loopback (no port). Accepts bracketed IPv6 (`[::1]`).
 */
export function isLoopbackHost(host: string): boolean {
  if (host === "localhost") {
    return true;
  }
  // Engine: Authority::host() keeps brackets for IPv6 — strip before parse.
  const stripped =
    host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;

  if (isIPv4(stripped)) {
    // IPv4 loopback is 127.0.0.0/8 (Rust IpAddr::is_loopback).
    const firstOctet = Number(stripped.split(".", 1)[0]);
    return firstOctet === 127;
  }

  if (isIPv6(stripped)) {
    // Only ::1 is IPv6 loopback. Normalize common expanded form.
    const compact = stripped.toLowerCase();
    if (compact === "::1" || compact === "0:0:0:0:0:0:0:1") {
      return true;
    }
    // Collapse zero runs via URL hostname normalization when possible.
    try {
      const normalized = new URL(`http://[${stripped}]`).hostname;
      const inner =
        normalized.startsWith("[") && normalized.endsWith("]")
          ? normalized.slice(1, -1)
          : normalized;
      return inner.toLowerCase() === "::1";
    } catch {
      return false;
    }
  }

  return false;
}

function nonLoopbackErrorMessage(apiUrl: string): string {
  return (
    `[Ledgerful Security Guard] NEXT_PUBLIC_LEDGERFUL_API_URL is set to a non-loopback address ('${apiUrl}').\n` +
    `To prevent accidental bearer token exfiltration to unauthorized remote servers, builds targeting\n` +
    `non-loopback daemons require explicit authorization.\n` +
    `Set ALLOW_REMOTE_DAEMON=1 in your environment if this is intended.`
  );
}

/**
 * Fail the build when the configured API base is non-loopback unless the
 * operator sets ALLOW_REMOTE_DAEMON=1. Unset URL is OK (defaults to loopback).
 */
export function assertApiBaseAllowed(
  apiUrl: string | undefined,
  allowRemoteDaemon: string | undefined,
): void {
  if (apiUrl === undefined || apiUrl === "") {
    return;
  }

  let hostname: string;
  try {
    hostname = new URL(apiUrl).hostname;
  } catch {
    throw new Error(
      `[Ledgerful Security Guard] NEXT_PUBLIC_LEDGERFUL_API_URL is not a valid URL ('${apiUrl}').`,
    );
  }

  if (isLoopbackHost(hostname)) {
    return;
  }

  if (allowRemoteDaemon === "1") {
    return;
  }

  throw new Error(nonLoopbackErrorMessage(apiUrl));
}
