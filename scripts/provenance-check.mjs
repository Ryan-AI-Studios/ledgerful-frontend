import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const MIN_DOWNLOADS = 100;
const MIN_AGE_DAYS = 90;
const TYPO_DISTANCE = 2;

// Very small set of well-known popular package names used for typosquat checks.
const WELL_KNOWN = new Set([
  'react', 'react-dom', 'next', 'typescript', 'tailwindcss', '@tailwindcss/postcss',
  'lucide-react', 'clsx', 'tailwind-merge', 'class-variance-authority',
]);

function levenshtein(a, b) {
  if (a.length < b.length) [a, b] = [b, a];
  if (b.length === 0) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function typosquatScore(name) {
  let min = Infinity;
  for (const known of WELL_KNOWN) {
    if (name === known) continue;
    const d = levenshtein(name, known);
    if (d < min) min = d;
  }
  return min;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

/** Check a single package against age/downloads/typosquat heuristics. */
export async function checkPackage(name) {
  const record = { name, warnings: [], errors: [] };
  try {
    const meta = await fetchJson(`https://registry.npmjs.org/${encodeURIComponent(name)}`);
    const latest = meta['dist-tags']?.latest;
    const latestVersion = latest ? meta.versions?.[latest] : null;
    record.latest = latest;
    record.created = meta.time?.created;
    if (record.created) {
      const ageDays = (Date.now() - new Date(record.created).getTime()) / (24 * 60 * 60 * 1000);
      record.ageDays = Math.round(ageDays);
      if (ageDays < MIN_AGE_DAYS) {
        record.warnings.push(`Package age ${Math.round(ageDays)}d < ${MIN_AGE_DAYS}d threshold`);
      }
    }
    if (latestVersion?.maintainers?.length === 1) {
      record.singleMaintainer = true;
    }

    const dl = await fetchJson(
      `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(name)}`
    );
    record.downloadsPerWeek = dl.downloads ?? 0;
    if (record.downloadsPerWeek < MIN_DOWNLOADS) {
      record.warnings.push(
        `Downloads ${record.downloadsPerWeek.toLocaleString()}/week < ${MIN_DOWNLOADS} threshold`
      );
    }

    const typo = typosquatScore(name);
    record.typosquatDistance = typo;
    if (typo <= TYPO_DISTANCE) {
      record.warnings.push(`Typosquat distance ${typo} <= ${TYPO_DISTANCE} to a well-known package`);
    }
  } catch (err) {
    record.errors.push(err.message);
  }
  return record;
}

function depKeys(pkg) {
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]);
}

function parseArgs(argv) {
  const opts = { newOnly: false, base: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--new-only') {
      opts.newOnly = true;
    } else if (a === '--base') {
      opts.base = argv[++i] ?? null;
    } else if (a.startsWith('--base=')) {
      opts.base = a.slice('--base='.length);
    } else if (a === '--help' || a === '-h') {
      opts.help = true;
    }
  }
  // Env overrides for CI convenience
  if (process.env.PROVENANCE_NEW_ONLY === '1' || process.env.PROVENANCE_NEW_ONLY === 'true') {
    opts.newOnly = true;
  }
  if (!opts.base && process.env.BASE_REF) {
    opts.base = process.env.BASE_REF;
  }
  if (!opts.base) {
    opts.base = 'origin/main';
  }
  return opts;
}

function readPackageJsonAt(ref) {
  try {
    const raw = execFileSync('git', ['show', `${ref}:package.json`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return JSON.parse(raw);
  } catch (err) {
    const msg = err.stderr?.toString?.() || err.message || String(err);
    throw new Error(`Failed to read package.json at ${ref}: ${msg}`);
  }
}

function resolveNamesToScan(opts) {
  const headPkg = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
  );
  const headKeys = depKeys(headPkg);

  if (!opts.newOnly) {
    return {
      mode: 'full',
      names: [...headKeys].sort(),
      base: null,
    };
  }

  const basePkg = readPackageJsonAt(opts.base);
  const baseKeys = depKeys(basePkg);
  const added = [...headKeys].filter((n) => !baseKeys.has(n)).sort();
  return {
    mode: 'new-only',
    names: added,
    base: opts.base,
  };
}

function writeReport(report) {
  const outDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'slopsquat-frontend.json'),
    JSON.stringify(report, null, 2)
  );
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(`Usage:
  node scripts/provenance-check.mjs                  # full scan (exit 1 on errors only)
  node scripts/provenance-check.mjs --new-only [--base <ref>]

  --new-only   Only scan dependency names added vs base (default base: origin/main or BASE_REF)
  --base <ref> Git ref for base package.json (also BASE_REF env)

  New-only mode exits non-zero if any new dep has warnings OR errors.
  Full-scan mode exits 0 on warnings (manual adjudication), 1 on registry/network errors.`);
    process.exitCode = 0;
    return;
  }

  let resolved;
  try {
    resolved = resolveNamesToScan(opts);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
    return;
  }

  if (resolved.mode === 'new-only' && resolved.names.length === 0) {
    console.log(
      `Provenance check (new-only vs ${resolved.base}): no new dependencies. Clean exit.`
    );
    writeReport({
      scannedAt: new Date().toISOString(),
      mode: 'new-only',
      base: resolved.base,
      total: 0,
      clean: 0,
      warnings: 0,
      errors: 0,
      packages: [],
      scanStatus: 'clean',
    });
    process.exitCode = 0;
    return;
  }

  if (resolved.mode === 'new-only') {
    console.log(
      `Provenance check (new-only vs ${resolved.base}): scanning ${resolved.names.length} new package(s): ${resolved.names.join(', ')}`
    );
  } else {
    console.log(`Provenance check (full): scanning ${resolved.names.length} package(s).`);
  }

  const results = [];
  for (const name of resolved.names) {
    results.push(await checkPackage(name));
  }

  const warnings = results.filter((r) => r.warnings.length > 0 && r.errors.length === 0);
  const errors = results.filter((r) => r.errors.length > 0);
  const clean = results.filter((r) => r.warnings.length === 0 && r.errors.length === 0);

  const report = {
    scannedAt: new Date().toISOString(),
    mode: resolved.mode,
    base: resolved.base,
    total: resolved.names.length,
    clean: clean.length,
    warnings: warnings.length,
    errors: errors.length,
    packages: results,
  };

  if (errors.length > 0) {
    console.error(`Provenance check completed with ${errors.length} error(s).`);
    for (const r of errors) {
      console.error(`  ${r.name}: ${r.errors.join('; ')}`);
    }
  }
  if (warnings.length > 0) {
    console.warn(`Provenance check completed with ${warnings.length} warning(s).`);
    for (const r of warnings) {
      console.warn(`  ${r.name}: ${r.warnings.join('; ')}`);
    }
  }
  if (errors.length === 0 && warnings.length === 0) {
    console.log('Provenance check completed: 0 warnings, 0 errors.');
  }

  // Exit policy:
  // - Full scan: registry/network errors -> exit 1; heuristic warnings -> exit 0 (manual).
  // - New-only: any warning OR error on a newly added dep -> exit 1 (CI gate).
  if (resolved.mode === 'new-only') {
    if (errors.length > 0 || warnings.length > 0) {
      console.error(
        `NEW-DEP GATE: ${errors.length} error(s), ${warnings.length} warning(s) on newly added packages.`
      );
      report.scanStatus = errors.length > 0 ? 'errors' : 'warnings';
      writeReport(report);
      process.exitCode = 1;
      return;
    }
    report.scanStatus = 'clean';
    writeReport(report);
    process.exitCode = 0;
    return;
  }

  if (errors.length > 0) {
    console.error(`SCAN ERRORS: ${errors.length} package(s) could not be verified.`);
    for (const r of errors) {
      console.error(`  ${r.name}: ${r.errors.join('; ')}`);
    }
    report.scanStatus = 'errors';
    writeReport(report);
    process.exitCode = 1;
  } else if (warnings.length > 0) {
    report.scanStatus = 'warnings';
    writeReport(report);
    process.exitCode = 0;
  } else {
    report.scanStatus = 'clean';
    writeReport(report);
    process.exitCode = 0;
  }
}

main().catch((err) => {
  console.error('Unhandled error in provenance-check:', err);
  process.exitCode = 1;
});
