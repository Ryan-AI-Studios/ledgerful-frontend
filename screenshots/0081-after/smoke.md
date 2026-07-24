# 0081 DoD-7 smoke evidence

## Static host (vercel.ts-equivalent headers on out/)
- Command: `node scripts/smoke-0081-csp.mjs`
- Host: http://127.0.0.1:52181
- Routes: /, /dashboard, /changes, /ledger, /hotspots, /graph, /settings, /status, /projects, /compliance, /docs
- Result: all 200, CSP present, no script-src unsafe-inline, **0 CSP violations**

## Daemon spa-dir (engine header parity)
- Command: `ledgerful web start --port 52001 --spa-dir C:\dev\ledgerful-frontend\out --background --print-token=false`
- Log: Loaded CSP script hashes from --spa-dir sidecar
- Headers: hash CSP (sha256 present), **no HSTS**, X-Frame-Options DENY, XCTO nosniff, COOP same-origin, Permissions-Policy deny list
- Playwright routes (same 11): **0 CSP violations**, hasHsts=false all routes

## Phase 0 vercel.ts timing residual
- Committed-manifest design: vercel.ts only reads git-committed `.csp/csp-script-hashes.json` (no same-build generation dependency)
- Production proof of headers delivery is Vercel preview/CI on the PR
