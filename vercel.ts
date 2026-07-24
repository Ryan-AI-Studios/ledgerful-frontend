/**
 * Programmatic Vercel config (DoD-1 / DoD-2).
 *
 * Reads the *committed* `.csp/csp-script-hashes.json` only — never hashes
 * generated in the same build. `npm run build` double-builds and diff-checks
 * that file so CI fails on drift instead of shipping a mismatched CSP.
 *
 * Use only this file (no vercel.json) — Vercel allows one config file.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { routes, type VercelConfig } from "@vercel/config/v1";

type CspManifest = {
  routes: Record<string, string[]>;
  union: string[];
};

const DEFAULT_API_URL = "http://127.0.0.1:52001";

/** Deny-by-default Permissions-Policy — matches engine PERMISSIONS_POLICY. */
const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), " +
  "usb=(), display-capture=(), accelerometer=(), gyroscope=(), magnetometer=(), " +
  "browsing-topics=()";

/**
 * HSTS for the HTTPS (Vercel) host only — never on the loopback daemon path.
 * Decision: includeSubDomains yes; preload **no**. We do not submit this
 * domain to the browser HSTS preload list (irreversible / multi-month removal).
 */
const HSTS_VALUE = "max-age=63072000; includeSubDomains";

function loadCommittedUnion(): string[] {
  const raw = readFileSync(
    join(process.cwd(), ".csp", "csp-script-hashes.json"),
    "utf8",
  );
  const manifest = JSON.parse(raw) as CspManifest;
  if (!Array.isArray(manifest.union) || manifest.union.length === 0) {
    throw new Error(
      "vercel.ts: committed .csp/csp-script-hashes.json has empty or missing union",
    );
  }
  return manifest.union;
}

function apiOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_LEDGERFUL_API_URL ?? DEFAULT_API_URL;
  return new URL(raw).origin;
}

function buildCsp(union: string[], origin: string): string {
  const scriptSrc = ["'self'", ...union.map((h) => `'${h}'`)].join(" ");
  return [
    "default-src 'self'",
    `connect-src 'self' ${origin}`,
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

const csp = buildCsp(loadCommittedUnion(), apiOrigin());

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "npm run build",
  installCommand: "npm ci",
  regions: ["iad1"],
  env: {
    NEXT_TELEMETRY_DISABLED: "1",
  },
  git: {
    deploymentEnabled: {
      main: true,
    },
  },
  headers: [
    routes.header("/(.*)", [
      { key: "Content-Security-Policy", value: csp },
      { key: "Strict-Transport-Security", value: HSTS_VALUE },
      { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ]),
  ],
};
