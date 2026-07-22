# Deploy 0077 telemetry-ingest hardening to Supabase.
# Requires: SUPABASE_ACCESS_TOKEN, project linked (ref scmxtnjqqklvcwyeouvj)
# Usage (PowerShell):
#   $env:SUPABASE_ACCESS_TOKEN = "<personal access token from supabase.com/dashboard/account/tokens>"
#   .\scripts\deploy-0077-telemetry.ps1
#
# Cutover:
#   (a) optional: TELEMETRY_REQUIRE_TOKEN=false  (pre-CLI only)
#   (d) require:  TELEMETRY_REQUIRE_TOKEN=true   (default after engine PR #53)

$ErrorActionPreference = "Stop"
$ProjectRef = "scmxtnjqqklvcwyeouvj"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Set SUPABASE_ACCESS_TOKEN first (Supabase dashboard → Account → Access Tokens)."
}

# Staged cutover (phase0):
#   (a)+(b) deploy with OPTIONAL credential + fail-closed quotas
#   (c)     engine CLI ships header (PR #53 — done on main)
#   (d)     flip TELEMETRY_REQUIRE_TOKEN=true after verifying a shipping CLI sends it
#   (e)     retire legacy keys after inventory
$RequireToken = if ($env:TELEMETRY_REQUIRE_TOKEN) { $env:TELEMETRY_REQUIRE_TOKEN } else { "false" }
Write-Host "Deploying with TELEMETRY_REQUIRE_TOKEN=$RequireToken (default false = cutover step a/b)"

npx supabase secrets set `
  --project-ref $ProjectRef `
  "TELEMETRY_INGEST_TOKEN=lf-tel-v1-7c4e9b2a1f8d3e6a0c5b9d4e8f1a2b3c" `
  "TELEMETRY_REQUIRE_TOKEN=$RequireToken"

# SERVICE_ROLE_KEY / UPSTASH_* should already exist from 0030 — re-set if rotated:
# npx supabase secrets set --project-ref $ProjectRef "SERVICE_ROLE_KEY=<sb_secret_...>"

npx supabase functions deploy telemetry-ingest --project-ref $ProjectRef

# Migrations need a linked project + DB password (not --project-ref).
if ($env:SUPABASE_DB_PASSWORD -or $env:supabase_database_password) {
  $dbPass = if ($env:SUPABASE_DB_PASSWORD) { $env:SUPABASE_DB_PASSWORD } else { $env:supabase_database_password }
  npx supabase link --project-ref $ProjectRef -p $dbPass
  npx supabase db push --linked -p $dbPass --yes
} else {
  Write-Host "Skip db push: set SUPABASE_DB_PASSWORD or supabase_database_password to apply migrations."
}

Write-Host "Deployed (step a/b). Smoke unauthenticated:"
Write-Host "  # optional mode: 2xx/4xx schema; require mode: 401"
Write-Host "  curl -sS -o NUL -w '%{http_code}' -X POST `"https://$ProjectRef.supabase.co/functions/v1/telemetry-ingest`" -d '{}'"
Write-Host "After CLI release verified, re-run with:"
Write-Host "  `$env:TELEMETRY_REQUIRE_TOKEN='true'; .\scripts\deploy-0077-telemetry.ps1"
