/**
 * Shared CSP hash / policy helpers for static-export builds.
 * Used by build-with-csp.mjs and check-csp.mjs.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parse } from "parse5";

export const DEFAULT_API_URL = "http://127.0.0.1:52001";

/** Deny-by-default Permissions-Policy (matches engine PERMISSIONS_POLICY). */
export const PERMISSIONS_POLICY =
  "camera=(), microphone=(), geolocation=(), payment=(), " +
  "usb=(), display-capture=(), accelerometer=(), gyroscope=(), magnetometer=(), " +
  "browsing-topics=()";

/**
 * HSTS for the HTTPS (Vercel) host only.
 * No `preload` — we do not submit this domain to the HSTS preload list;
 * includeSubDomains alone is enough for deployment hardening without the
 * irreversible preload commitment.
 */
export const HSTS_VALUE = "max-age=63072000; includeSubDomains";

export function projectPaths(root = process.cwd()) {
  return {
    root,
    outDir: path.join(root, "out"),
    hashDirectory: path.join(root, ".csp"),
    hashFile: path.join(root, ".csp", "csp-script-hashes.json"),
    vercelTs: path.join(root, "vercel.ts"),
  };
}

export async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return htmlFiles(target);
      return entry.isFile() && entry.name.endsWith(".html") ? [target] : [];
    }),
  );
  return files.flat();
}

/** Map `out/foo/bar.html` → `/foo/bar`, `out/index.html` → `/`. */
export function routeFor(file, outDir) {
  const relative = path.relative(outDir, file).replaceAll("\\", "/");
  let route = `/${relative.slice(0, -".html".length)}`;
  if (route.endsWith("/index")) {
    route = route.slice(0, -"/index".length) || "/";
  }
  if (route === "/index") return "/";
  return route;
}

export function inlineScripts(html) {
  const scripts = [];
  const nodes = [parse(html)];
  while (nodes.length > 0) {
    const node = nodes.pop();
    if (node.childNodes) nodes.push(...node.childNodes);
    if (node.tagName !== "script" || node.attrs?.some((attr) => attr.name === "src")) {
      continue;
    }
    const script = (node.childNodes ?? [])
      .filter((child) => child.nodeName === "#text")
      .map((child) => child.value)
      .join("");
    if (script) scripts.push(script);
  }
  return scripts;
}

export function hashInlineScript(script) {
  const digest = createHash("sha256").update(script).digest("base64");
  return `sha256-${digest}`;
}

/**
 * Walk out HTML files and build `{ routes, union }` manifest.
 * @returns {{ routes: Record<string, string[]>, union: string[] }}
 */
export async function extractManifest(outDir) {
  const routes = {};
  const unionSet = new Set();

  for (const file of await htmlFiles(outDir)) {
    const html = await readFile(file, "utf8");
    const hashes = new Set();
    for (const script of inlineScripts(html)) {
      const token = hashInlineScript(script);
      hashes.add(token);
      unionSet.add(token);
    }
    routes[routeFor(file, outDir)] = [...hashes].sort();
  }

  const sortedRoutes = Object.fromEntries(
    Object.entries(routes).sort(([a], [b]) => a.localeCompare(b)),
  );

  return {
    routes: sortedRoutes,
    union: [...unionSet].sort(),
  };
}

export async function loadCommittedManifest(hashFile) {
  const raw = await readFile(hashFile, "utf8");
  return JSON.parse(raw);
}

export function manifestsEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Assert every inline script in out HTML is covered by that route's
 * hash list and by the union. Throws on empty coverage or missing hashes.
 */
export async function assertInlineScriptCoverage(outDir, manifest) {
  if (!manifest?.routes || !Array.isArray(manifest.union)) {
    throw new Error("CSP manifest must have { routes, union } shape.");
  }
  const union = new Set(manifest.union);
  const files = await htmlFiles(outDir);
  const gaps = [];

  for (const file of files) {
    const html = await readFile(file, "utf8");
    const scripts = inlineScripts(html);
    if (scripts.length === 0) continue;

    const route = routeFor(file, outDir);
    const routeHashes = manifest.routes[route];
    if (!routeHashes || routeHashes.length === 0) {
      gaps.push(`${route}: has ${scripts.length} inline script(s) but no route hashes`);
      continue;
    }
    const routeSet = new Set(routeHashes);
    for (const script of scripts) {
      const token = hashInlineScript(script);
      if (!routeSet.has(token)) {
        gaps.push(`${route}: missing route hash ${token}`);
      }
      if (!union.has(token)) {
        gaps.push(`${route}: missing union hash ${token}`);
      }
    }
  }

  if (gaps.length > 0) {
    throw new Error(
      `CSP manifest does not cover all inline scripts:\n  - ${gaps.join("\n  - ")}`,
    );
  }
}

/** Extract origin (protocol + host + port) from an API base URL. */
export function apiOriginFromUrl(apiUrl = DEFAULT_API_URL) {
  const url = new URL(apiUrl);
  return url.origin;
}

/**
 * Build the Vercel-hosted CSP header value.
 * @param {string[]} unionHashes bare `sha256-...` tokens (no quotes)
 * @param {string} apiOrigin connect-src extra origin
 */
export function buildVercelCsp(unionHashes, apiOrigin) {
  const scriptTokens = ["'self'", ...unionHashes.map((h) => `'${h}'`)].join(" ");
  return [
    "default-src 'self'",
    `connect-src 'self' ${apiOrigin}`,
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${scriptTokens}`,
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

/**
 * True if the script-src directive (not style-src) allows 'unsafe-inline'.
 */
export function scriptSrcHasUnsafeInline(csp) {
  const match = csp.match(/(?:^|;)\s*script-src\s+([^;]+)/i);
  if (!match) return false;
  return /'unsafe-inline'/.test(match[1]);
}
