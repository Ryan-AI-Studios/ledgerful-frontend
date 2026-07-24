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

## Community

- **Questions and setup help:** [GitHub Discussions](https://github.com/Ryan-AI-Studios/ledgerful-frontend/discussions)
- **Bug reports:** [GitHub Issues](https://github.com/Ryan-AI-Studios/ledgerful-frontend/issues)
- **Security reports:** See [SECURITY.md](SECURITY.md) — do not open public issues for security reports.

## License

PolyForm Noncommercial License 1.0.0 with a Small-Entity Commercial Exception. See [LICENSE](LICENSE) and [COMMERCIAL-EXCEPTION.md](COMMERCIAL-EXCEPTION.md) for details.