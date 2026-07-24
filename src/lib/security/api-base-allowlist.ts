/**
 * Build-time loopback allowlist for NEXT_PUBLIC_LEDGERFUL_API_URL (FE-A3).
 *
 * Host matching mirrors the engine's `is_loopback_host` (middleware.rs):
 * localhost, IPv4 loopback (127.0.0.0/8), IPv6 loopback (::1), and
 * IPv4-mapped IPv6 loopback (::ffff:127.0.0.0/8), with `[]` stripped from
 * IPv6 literals before parse. Rust `IpAddr::is_loopback` treats mapped
 * loopback the same way.
 */

import { isIPv4, isIPv6 } from "node:net";

/**
 * If `addr` is IPv4-mapped IPv6 (::ffff:0:0/96), return the embedded IPv4
 * dotted-quad; otherwise null. Accepts dotted (`::ffff:127.0.0.1`) and
 * hex (`::ffff:7f00:1`) forms, including expanded prefixes.
 */
function ipv4FromMappedIPv6(addr: string): string | null {
  let normalized = addr.toLowerCase();
  try {
    const hostname = new URL(`http://[${addr}]`).hostname;
    normalized = (
      hostname.startsWith("[") && hostname.endsWith("]")
        ? hostname.slice(1, -1)
        : hostname
    ).toLowerCase();
  } catch {
    // keep original lowercased form
  }

  // Must be IPv4-mapped: first 80 bits zero, next 16 bits 0xffff.
  // After compression: ::ffff:… or 0:0:0:0:0:ffff:…
  const mappedPrefix = /^(?:0:0:0:0:0:ffff:|::ffff:)/i;
  if (!mappedPrefix.test(normalized)) {
    return null;
  }
  const suffix = normalized.replace(mappedPrefix, "");

  if (isIPv4(suffix)) {
    return suffix;
  }

  // Hex form: high:low (e.g. 7f00:1 → 127.0.0.1)
  const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(suffix);
  if (!hex) {
    return null;
  }
  const hi = Number.parseInt(hex[1], 16);
  const lo = Number.parseInt(hex[2], 16);
  if (
    Number.isNaN(hi) ||
    Number.isNaN(lo) ||
    hi < 0 ||
    hi > 0xffff ||
    lo < 0 ||
    lo > 0xffff
  ) {
    return null;
  }
  return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
}

function isIPv4Loopback(ipv4: string): boolean {
  // IPv4 loopback is 127.0.0.0/8 (Rust IpAddr::is_loopback).
  const firstOctet = Number(ipv4.split(".", 1)[0]);
  return firstOctet === 127;
}

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
    return isIPv4Loopback(stripped);
  }

  if (isIPv6(stripped)) {
    const compact = stripped.toLowerCase();
    if (compact === "::1" || compact === "0:0:0:0:0:0:0:1") {
      return true;
    }

    // IPv4-mapped IPv6 loopback (::ffff:127.0.0.0/8) — Rust IpAddr::is_loopback.
    const mapped = ipv4FromMappedIPv6(stripped);
    if (mapped !== null) {
      return isIPv4Loopback(mapped);
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
