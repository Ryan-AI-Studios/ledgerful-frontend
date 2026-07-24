/**
 * CI checks for hash-based CSP (DoD-6 frontend):
 * - committed manifest covers every inline script in out HTML (when out/ exists)
 * - vercel.ts CSP never allows script-src 'unsafe-inline' (style-src may)
 * - vercel.ts reads committed .csp/csp-script-hashes.json (not live-generated)
 */
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import process from "node:process";

import {
  apiOriginFromUrl,
  assertInlineScriptCoverage,
  buildVercelCsp,
  DEFAULT_API_URL,
  loadCommittedManifest,
  projectPaths,
  scriptSrcHasUnsafeInline,
} from "./csp-lib.mjs";

const paths = projectPaths();

async function pathExists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Pull the script-src directive that vercel.ts would emit by rebuilding CSP
 * from the committed manifest the same way vercel.ts does.
 */
function expectedCspFromManifest(manifest) {
  const apiOrigin = apiOriginFromUrl(
    process.env.NEXT_PUBLIC_LEDGERFUL_API_URL ?? DEFAULT_API_URL,
  );
  return buildVercelCsp(manifest.union, apiOrigin);
}

/**
 * Source-level guards on vercel.ts so a future edit cannot reintroduce
 * script-src 'unsafe-inline' without failing CI.
 */
function assertVercelTsSource(source) {
  const errors = [];

  if (!source.includes("csp-script-hashes.json")) {
    errors.push("vercel.ts must read committed .csp/csp-script-hashes.json");
  }

  // Reject any assignment that puts 'unsafe-inline' into a script-src token list.
  // style-src 'unsafe-inline' is allowed and expected.
  const lines = source.split(/\r?\n/);
  for (const line of lines) {
    if (/script-src/i.test(line) && /'unsafe-inline'/.test(line)) {
      errors.push(
        `vercel.ts line must not put 'unsafe-inline' in script-src: ${line.trim()}`,
      );
    }
  }

  // Heuristic: ensure script-src is built from hashes / 'self', not a hard-coded unsafe-inline policy.
  if (!/script-src/i.test(source) && !/scriptSrc|script_src|union/i.test(source)) {
    errors.push("vercel.ts must construct a script-src directive (hashes + 'self')");
  }

  if (errors.length > 0) {
    throw new Error(`vercel.ts CSP source checks failed:\n  - ${errors.join("\n  - ")}`);
  }
}

async function main() {
  const manifest = await loadCommittedManifest(paths.hashFile);
  if (!manifest.routes || !Array.isArray(manifest.union)) {
    throw new Error(
      `Committed CSP manifest at ${paths.hashFile} must have { routes, union } shape.`,
    );
  }
  if (manifest.union.length === 0) {
    throw new Error("Committed CSP manifest union is empty — refuse empty hash CSP.");
  }

  const csp = expectedCspFromManifest(manifest);
  if (scriptSrcHasUnsafeInline(csp)) {
    throw new Error(
      "Built CSP contains script-src 'unsafe-inline' — strict hash CSP required on Vercel.",
    );
  }
  if (!/script-src\s+'self'/.test(csp)) {
    throw new Error("Built CSP must include script-src 'self' before hashes.");
  }
  if (!csp.includes("object-src 'none'")) {
    throw new Error("Built CSP missing object-src 'none'.");
  }
  if (!csp.includes("frame-ancestors 'none'")) {
    throw new Error("Built CSP missing frame-ancestors 'none'.");
  }

  if (!(await pathExists(paths.vercelTs))) {
    throw new Error("vercel.ts is missing — only one Vercel config file is allowed (no vercel.json).");
  }
  const vercelSource = await readFile(paths.vercelTs, "utf8");
  assertVercelTsSource(vercelSource);

  // Reconstruct and scan any CSP string literals in the source for safety.
  for (const match of vercelSource.matchAll(/["'`][^"'`]*script-src[^"'`]*["'`]/gi)) {
    const literal = match[0];
    if (scriptSrcHasUnsafeInline(literal)) {
      throw new Error(
        `vercel.ts contains a CSP literal with script-src 'unsafe-inline': ${literal.slice(0, 120)}`,
      );
    }
  }

  if (await pathExists(paths.outDir)) {
    await assertInlineScriptCoverage(paths.outDir, manifest);
    console.log(
      `csp:check OK — ${manifest.union.length} union hashes; out/ inline scripts covered; ` +
        "no script-src 'unsafe-inline'.",
    );
  } else {
    console.log(
      `csp:check OK — ${manifest.union.length} union hashes; no out/ (skip HTML coverage); ` +
        "no script-src 'unsafe-inline'.",
    );
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
