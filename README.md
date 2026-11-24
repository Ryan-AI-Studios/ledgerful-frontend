# Ledgerful Frontend

The dashboard for [Ledgerful](https://github.com/Ryan-AI-Studios/Ledgerful) — a local-first change-intelligence engine that tracks code changes with cryptographic provenance.

## Getting Started

```bash
npm install
npm run dev
```

The dev server starts on port 52001. The dashboard connects to the Ledgerful daemon at the URL specified by `NEXT_PUBLIC_LEDGERFUL_API_URL` (default `http://127.0.0.1:52001`, see `.env.example`). If the daemon is unavailable, the dashboard falls back to mock data so the UI remains functional for development.

Production builds require a **loopback** API base by default. To bake a non-loopback `NEXT_PUBLIC_LEDGERFUL_API_URL` into the bundle, set `ALLOW_REMOTE_DAEMON=1` (documented in `.env.example`).

> **Note:** The dev server and daemon both default to port 52001. For live-data development, either run the daemon on a different port and set `NEXT_PUBLIC_LEDGERFUL_API_URL` accordingly, or start the dev server on an alternate port (`npm run dev -- --port 3000`).

## Build

```bash
npm run build
```

## CSP hash manifest

`npm run build` runs the static export through a CSP hash pipeline: double `next build`, hash every inline `<script>` in `out/`, check same-machine determinism, and **diff-check** against committed `.csp/csp-script-hashes.json` (fail-on-drift; never silently overwrites). `vercel.ts` and the engine vendored copy read that committed file only.

The CI **build** job is **windows-latest** — when refreshing hashes for CI, regenerate on Windows without local `.env*` (Next inlines `NEXT_PUBLIC_*` into flight payloads):

```powershell
Get-ChildItem .env* -ErrorAction SilentlyContinue | Rename-Item -NewName { $_.Name + ".__cspbak" }
$env:UPDATE_CSP_MANIFEST = "1"
npm run build
Get-ChildItem *.env*.__cspbak, .env*.__cspbak -ErrorAction SilentlyContinue | ForEach-Object {
  Rename-Item $_ ($_.Name -replace "\.__cspbak$", "")
}
```

Then commit `.csp/csp-script-hashes.json` (and re-vendor `ledgerful/src/commands/web/server/csp_script_hashes.json` when shipping with the engine). `UPDATE_CSP_MANIFEST=1` is refused when `CI` or `VERCEL` is set. Run `npm run csp:check` to verify coverage and that `script-src` never includes `'unsafe-inline'`.

## Change evidence

Open **View evidence** on a committed row in **Changes** to see the exact Git pair served by your local daemon. Choose a compatible first-parent baseline to see differences in resolved call counts. **Verification** shows the recorded selection and command outcomes for the revision when available. Demo data and older daemons retain the ordinary Changes list.

The vendored [OpenAPI contract](src/lib/api/contract/openapi.json) comes from the [0608 engine merge](https://github.com/Ryan-AI-Studios/Ledgerful/blob/af430c81be0dbef01b87f11b0c3bd0968560df4f/docs/api/openapi.json). Its SHA-256 is `a9bc20e23d32425ded4c85eae28c3340a9dc7b2fef8b155cba4ceb8131c582af`. The engine documents [baseline preparation and capture](https://github.com/Ryan-AI-Studios/Ledgerful/blob/af430c81be0dbef01b87f11b0c3bd0968560df4f/docs/change-evidence.md). Refresh `src/lib/api/generated.d.ts` from the vendored bytes with `npm run contract:generate`.

### Paired browser verification

Use an isolated two-commit fixture and the ordinary `out/` served by its daemon on `http://127.0.0.1:52001`. Prepare and attest a first-parent baseline, then capture verification at the child revision. Use the fixture’s private token file and an independent expected JSON receipt with the full revisions, baseline digest, measured Git paths and edges, and command attempts, scopes, plan positions, and exit results. The harness covers direct and client-side navigation, reload and sign-in, narrow layout, and the live `script-src` header.

```powershell
$env:LEDGERFUL_E2E_MODE = "current"
$env:LEDGERFUL_E2E_TOKEN_FILE = "<absolute path to the fixture token file>"
$env:LEDGERFUL_E2E_EXPECTED = "<absolute path to the sanitized expected JSON receipt>"
npm run test:e2e
```

Use `legacy` with a separate older-daemon fixture and its own token, `incomparable` with a stale-index fixture and the matching pair and baseline receipt, or `embedded` with a matching engine build and the current fixture receipt. The harness stores post-authentication screenshots and CSP and request receipts under `output/paired-evidence/`. It keeps request credentials and browser traces out of those artifacts.

## Community

- **Questions and setup help:** [GitHub Discussions](https://github.com/Ryan-AI-Studios/ledgerful-frontend/discussions)
- **Bug reports:** [GitHub Issues](https://github.com/Ryan-AI-Studios/ledgerful-frontend/issues)
- **Security reports:** See [SECURITY.md](SECURITY.md) — do not open public issues for security reports.

## License

PolyForm Noncommercial License 1.0.0 with a Small-Entity Commercial Exception. See [LICENSE](LICENSE) and [COMMERCIAL-EXCEPTION.md](COMMERCIAL-EXCEPTION.md) for details.
