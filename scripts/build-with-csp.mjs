/**
 * Production build for ledgerful-frontend static export with CSP hash pipeline.
 *
 * 1. next build → walk out HTML → SHA-256 hashes of inline scripts
 * 2. next build again → re-extract; fail on same-machine nondeterminism
 * 3. Diff against committed .csp/csp-script-hashes.json
 *    - match → success
 *    - differ + UPDATE_CSP_MANIFEST=1 → write committed file
 *    - differ otherwise → fail (do not silently overwrite)
 * 4. Coverage assert + csp:check
 */
import { spawnSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  assertInlineScriptCoverage,
  extractManifest,
  loadCommittedManifest,
  manifestsEqual,
  projectPaths,
} from "./csp-lib.mjs";

const paths = projectPaths();

function runNextBuild() {
  const nextBin = path.join(paths.root, "node_modules", "next", "dist", "bin", "next");
  // Static export dashboard — no --webpack (unlike ledgerful-web Vercel Node app).
  const result = spawnSync(process.execPath, [nextBin, "build"], {
    cwd: paths.root,
    env: process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function shouldUpdateManifest() {
  if (process.env.UPDATE_CSP_MANIFEST !== "1") return false;
  if (
    process.env.CI === "true" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL === "true"
  ) {
    throw new Error(
      "UPDATE_CSP_MANIFEST=1 is local-only. CI/Vercel must use the committed .csp/csp-script-hashes.json (fail-on-drift).",
    );
  }
  return true;
}

async function main() {
  await mkdir(paths.hashDirectory, { recursive: true });

  runNextBuild();
  const first = await extractManifest(paths.outDir);

  runNextBuild();
  const second = await extractManifest(paths.outDir);

  if (!manifestsEqual(first, second)) {
    throw new Error(
      "Inline script hashes changed across two consecutive production builds " +
        "(same-machine nondeterminism). Refusing to ship a hash-based CSP.",
    );
  }

  const generated = first;
  await assertInlineScriptCoverage(paths.outDir, generated);

  let committed = null;
  try {
    committed = await loadCommittedManifest(paths.hashFile);
  } catch {
    committed = null;
  }

  if (committed && manifestsEqual(committed, generated)) {
    console.log(
      `CSP manifest matches committed file (${generated.union.length} unique hashes, ` +
        `${Object.keys(generated.routes).length} routes).`,
    );
  } else if (shouldUpdateManifest()) {
    await writeFile(
      paths.hashFile,
      `${JSON.stringify(generated, null, 2)}\n`,
      "utf8",
    );
    console.log(
      "committed manifest updated; commit `.csp/csp-script-hashes.json` " +
        `(${generated.union.length} unique hashes, ${Object.keys(generated.routes).length} routes).`,
    );
  } else {
    const hint =
      "CSP script-hash manifest drifted from the committed copy.\n" +
      "Run with UPDATE_CSP_MANIFEST=1 to refresh, then commit `.csp/csp-script-hashes.json`:\n" +
      "  PowerShell:  $env:UPDATE_CSP_MANIFEST='1'; npm run build\n" +
      "  bash:        UPDATE_CSP_MANIFEST=1 npm run build\n" +
      "Do not silently overwrite — vercel.ts and the engine vendored copy read the committed file.";
    if (!committed) {
      throw new Error(`No committed CSP manifest at ${paths.hashFile}.\n${hint}`);
    }
    throw new Error(hint);
  }

  // Post-build CI checks (unsafe-inline guard + coverage against committed file).
  const check = spawnSync(process.execPath, [path.join(paths.root, "scripts", "check-csp.mjs")], {
    cwd: paths.root,
    env: process.env,
    stdio: "inherit",
  });
  if (check.status !== 0) process.exit(check.status ?? 1);

  console.log(
    `Verified ${generated.union.length} unique CSP hashes across ` +
      `${Object.keys(generated.routes).length} routes.`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
