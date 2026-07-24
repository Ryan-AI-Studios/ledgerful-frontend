/**
 * Programmatic Vercel config (DoD-1 / DoD-2).
 *
 * Reads the *committed* `.csp/csp-script-hashes.json` only — never hashes
 * generated in the same build. `npm run build` double-builds and diff-checks
 * that file so CI fails on drift instead of shipping a mismatched CSP.
 *
 * CSP string builders and header constants live in scripts/csp-lib.mjs
 * (shared with check-csp.mjs) — single source of truth.
 *
 * Use only this file (no vercel.json) — Vercel allows one config file.
 */
import { routes, type VercelConfig } from "@vercel/config/v1";
import {
  PERMISSIONS_POLICY,
  HSTS_VALUE,
  buildVercelCsp,
  apiOriginFromEnv,
  loadCommittedUnionSync,
} from "./scripts/csp-lib.mjs";

// csp-script-hashes.json is read inside loadCommittedUnionSync (path is the
// committed manifest gate for DoD-6 / check-csp.mjs source guards).
const csp = buildVercelCsp(loadCommittedUnionSync(), apiOriginFromEnv());

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
