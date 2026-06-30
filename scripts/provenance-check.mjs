import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const deps = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

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

async function checkPackage(name) {
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

async function main() {
  const names = Object.keys(deps).sort();
  const results = [];
  for (const name of names) {
    results.push(await checkPackage(name));
  }

  const warnings = results.filter(r => r.warnings.length > 0 && r.errors.length === 0);
  const errors = results.filter(r => r.errors.length > 0);
  const clean = results.filter(r => r.warnings.length === 0 && r.errors.length === 0);

  const report = {
    scannedAt: new Date().toISOString(),
    total: names.length,
    clean: clean.length,
    warnings: warnings.length,
    errors: errors.length,
    packages: results,
  };

  const outDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, 'slopsquat-frontend.json'),
    JSON.stringify(report, null, 2)
  );

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

  // Distinguish scan failures from heuristic warnings.
  // - Registry/network errors mean the scan did not actually complete -> exit 1.
  // - Heuristic warnings are for manual adjudication -> exit 0.
  if (errors.length > 0) {
    console.error(`SCAN ERRORS: ${errors.length} package(s) could not be verified.`);
    for (const r of errors) {
      console.error(`  ${r.name}: ${r.errors.join('; ')}`);
    }
    report.scanStatus = 'errors';
    process.exitCode = 1;
  } else if (warnings.length > 0) {
    report.scanStatus = 'warnings';
    process.exitCode = 0;
  } else {
    report.scanStatus = 'clean';
    process.exitCode = 0;
  }
}

main().catch(err => {
  console.error('Unhandled error in provenance-check:', err);
  process.exitCode = 1;
});
