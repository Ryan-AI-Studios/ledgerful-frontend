/**
 * DoD-7 smoke: serve `out/` with the same security headers vercel.ts emits,
 * walk dashboard routes, assert zero CSP violations in the browser console.
 *
 * Usage (after npm run build):
 *   node scripts/smoke-0081-csp.mjs
 */
import http from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import {
  apiOriginFromEnv,
  buildVercelCsp,
  HSTS_VALUE,
  loadCommittedUnionSync,
  PERMISSIONS_POLICY,
  projectPaths,
} from "./csp-lib.mjs";

const paths = projectPaths();
const PORT = 52181;
const BASE = `http://127.0.0.1:${PORT}`;

const ROUTES = [
  "/",
  "/dashboard",
  "/changes",
  "/ledger",
  "/hotspots",
  "/graph",
  "/settings",
  "/status",
  "/projects",
  "/compliance",
  "/docs",
];

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".ico")) return "image/x-icon";
  if (filePath.endsWith(".woff2")) return "font/woff2";
  return "application/octet-stream";
}

function securityHeaders() {
  const csp = buildVercelCsp(loadCommittedUnionSync(paths.root), apiOriginFromEnv());
  return {
    "Content-Security-Policy": csp,
    // HSTS only meaningful on HTTPS; still send for parity with vercel.ts on this local smoke host.
    "Strict-Transport-Security": HSTS_VALUE,
    "Permissions-Policy": PERMISSIONS_POLICY,
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function resolveFile(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split("?")[0]);
  let rel = cleaned === "/" ? "/index.html" : cleaned;
  if (!path.extname(rel)) {
    const asHtml = `${rel}.html`;
    const asIndex = path.join(rel, "index.html");
    if (existsSync(path.join(paths.outDir, asHtml))) rel = asHtml;
    else if (existsSync(path.join(paths.outDir, asIndex))) rel = asIndex;
    else rel = asHtml;
  }
  const full = path.normalize(path.join(paths.outDir, rel));
  if (!full.startsWith(paths.outDir)) return null;
  return full;
}

function startServer() {
  const headers = securityHeaders();
  const server = http.createServer((req, res) => {
    const file = resolveFile(req.url ?? "/");
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, headers);
      res.end("not found");
      return;
    }
    res.writeHead(200, { ...headers, "Content-Type": contentType(file) });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(PORT, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  if (!existsSync(path.join(paths.outDir, "index.html"))) {
    throw new Error("out/index.html missing — run npm run build first");
  }

  const server = await startServer();
  const violations = [];
  const consoleErrors = [];
  const routeResults = [];

  const browser = await chromium.launch({ headless: true });
  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const pageViolations = [];
      page.on("console", (msg) => {
        const text = msg.text();
        if (/content security policy|csp/i.test(text)) {
          pageViolations.push(text);
          violations.push({ route, text });
        }
        if (msg.type() === "error" && /content security policy|refused to/i.test(text)) {
          consoleErrors.push({ route, text });
        }
      });
      page.on("pageerror", (err) => {
        if (/content security policy/i.test(err.message)) {
          violations.push({ route, text: err.message });
        }
      });

      const url = `${BASE}${route}`;
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      const status = response?.status() ?? 0;
      // Give hydration a beat for delayed script eval
      await page.waitForTimeout(500);
      const cspHeader = response?.headers()["content-security-policy"] ?? "";
      routeResults.push({
        route,
        status,
        hasCsp: Boolean(cspHeader),
        scriptSrcUnsafeInline: /script-src[^;]*'unsafe-inline'/i.test(cspHeader),
        pageViolations: pageViolations.length,
      });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(JSON.stringify({ host: BASE, routeResults, violationCount: violations.length, violations }, null, 2));

  const failedNav = routeResults.filter((r) => r.status >= 400 || !r.hasCsp);
  if (failedNav.length > 0) {
    throw new Error(`Smoke navigation/header failures: ${JSON.stringify(failedNav)}`);
  }
  if (routeResults.some((r) => r.scriptSrcUnsafeInline)) {
    throw new Error("CSP response includes script-src 'unsafe-inline'");
  }
  if (violations.length > 0) {
    throw new Error(`CSP violations observed: ${JSON.stringify(violations, null, 2)}`);
  }
  console.log(`DoD-7 static smoke PASS — ${ROUTES.length} routes, 0 CSP violations`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
