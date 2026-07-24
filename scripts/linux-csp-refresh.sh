#!/usr/bin/env bash
# Refresh committed CSP hashes under a Linux Node image (CI parity).
# Hides local .env* so hashes match GitHub Actions (no secrets/.env.local).
# Prefer image node:24-bookworm to match .github/workflows/ci.yml node-version: 24.
set -euo pipefail
cd /app
node -v
npm -v

bak_suffix=".__cspbak"
for f in .env .env.local .env.development .env.production; do
  if [[ -f "$f" ]]; then
    mv "$f" "${f}${bak_suffix}"
  fi
done

restore() {
  for f in .env .env.local .env.development .env.production; do
    if [[ -f "${f}${bak_suffix}" ]]; then
      mv "${f}${bak_suffix}" "$f"
    fi
  done
}
trap restore EXIT

export UPDATE_CSP_MANIFEST=1
export NEXT_TELEMETRY_DISABLED=1
# Match GitHub Actions: Next.js changes some emission when CI=true.
export CI=true
unset VERCEL || true

npm ci
npm run build
