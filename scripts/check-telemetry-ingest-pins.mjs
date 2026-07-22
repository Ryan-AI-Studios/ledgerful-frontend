/**
 * DoD-4 guard: raw index.ts imports must be exact-version pinned (no @latest / unversioned).
 * deno.lock integrity hashes are the secondary pin (generated via `deno cache`).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = join(
  root,
  "supabase/functions/telemetry-ingest/index.ts",
);
const lockPath = join(
  root,
  "supabase/functions/telemetry-ingest/deno.lock",
);

const src = readFileSync(indexPath, "utf8");
const importRe =
  /from\s+["'](https:\/\/[^"']+)["']/g;
const urls = [...src.matchAll(importRe)].map((m) => m[1]);

if (urls.length === 0) {
  console.error("check-telemetry-ingest-pins: no remote imports found in index.ts");
  process.exit(1);
}

let failed = false;
for (const url of urls) {
  if (url.includes("@latest") || /@supabase\/[^@/"']+["']/.test(url)) {
    console.error(`Unpinned or latest import: ${url}`);
    failed = true;
  }
  // Require explicit version segment after package name for esm.sh / deno.land
  const versioned =
    /@\d+\.\d+\.\d+/.test(url) || /std@\d+\.\d+\.\d+/.test(url);
  if (!versioned) {
    console.error(`Missing exact version pin: ${url}`);
    failed = true;
  }
}

if (!existsSync(lockPath)) {
  console.error("Missing deno.lock — run: deno cache supabase/functions/telemetry-ingest/index.ts");
  failed = true;
}

if (failed) process.exit(1);
console.log(
  `check-telemetry-ingest-pins: OK (${urls.length} remote import(s), lock present)`,
);
