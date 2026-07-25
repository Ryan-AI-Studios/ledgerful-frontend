#requires -Version 7.2

# Branch-protection configuration for Ryan-AI-Studios/ledgerful-frontend.
# Idempotent: reads live settings, then PUTs the desired required checks while
# preserving enforce_admins (and other non-check fields where practical).
#
# DO NOT run this casually against live main. Orchestrator applies protection
# after CI job names are stable. Use -WhatIf to print the planned body only.
#
# Context names are bare job names (no workflow-name prefix), verified live via:
#   gh api repos/Ryan-AI-Studios/ledgerful-frontend/commits/<sha>/check-runs --jq '.check_runs[].name'
# Phase-0 evidence (2026-07-25) reported bare names:
#   contract-check, build, telemetry-ingest, security/bundle-scan,
#   security/gitleaks, security/semgrep, security/npm-audit
# plus Statuses-API context `ai-reviewed` from .github/workflows/ai-review-gate.yml.
#
# API shape: PUT required_status_checks.checks as [{context}, ...] (current format).
# Do NOT use the deprecated required_status_checks.contexts string array.
# app_id is omitted (matches live ai-reviewed entry with app_id: null).
#
# security/bundle-scan = ci.yml PR/push gate (NOT security/bundle-scan-manual from
# bundle-scan.yml, which is workflow_dispatch/schedule only and must never be required).

param(
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

$owner = 'Ryan-AI-Studios'
$repo = 'ledgerful-frontend'
$branch = 'main'
$protectionPath = "repos/${owner}/${repo}/branches/${branch}/protection"

# Required check contexts. Bare job names must match GitHub check-run / status
# context strings exactly. Re-verify before applying if workflows were renamed:
#   gh api repos/.../commits/<sha>/check-runs --jq '.check_runs[].name'
$requiredContexts = @(
  'ai-reviewed'              # Statuses API; owned by ai-review-gate.yml
  'contract-check'           # ci.yml job key (no explicit name:)
  'build'                    # ci.yml job key
  'security/npm-audit'       # security.yml job name:
  'security/gitleaks'        # security.yml job name:
  'security/semgrep'         # security.yml job name:
  'security/bundle-scan'     # ci.yml job name: (PR gate; not bundle-scan-manual)
  'knip'                     # ci.yml job name:
  'provenance-check'         # ci.yml job name:
)

function Get-LiveEnforceAdmins {
  # Fail closed: never PUT if we cannot read live protection. Defaulting
  # enforce_admins and continuing would risk overwriting other live fields
  # with an incomplete/assumed body.
  $rawText = gh api $protectionPath 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to GET live branch protection (exit $LASTEXITCODE). Aborting without PUT. Output: $rawText"
  }
  $raw = $rawText | ConvertFrom-Json
  if ($null -eq $raw) {
    throw "Live branch protection GET returned empty JSON. Aborting without PUT."
  }
  # Live shape: enforce_admins.enabled (boolean) on GET responses
  if ($null -ne $raw.enforce_admins -and $null -ne $raw.enforce_admins.enabled) {
    return [bool]$raw.enforce_admins.enabled
  }
  if ($raw.enforce_admins -is [bool]) {
    return [bool]$raw.enforce_admins
  }
  throw "Live protection JSON missing enforce_admins. Aborting without PUT."
}

$enforceAdmins = Get-LiveEnforceAdmins

$checks = @($requiredContexts | ForEach-Object { @{ context = $_ } })

$protectionObject = [ordered]@{
  required_status_checks        = [ordered]@{
    strict = $true
    checks = $checks
  }
  enforce_admins                = $enforceAdmins
  # Solo/AI workflow: checks-only protection; no required PR reviews
  required_pull_request_reviews = $null
  restrictions                  = $null
  allow_force_pushes            = $false
  allow_deletions               = $false
}

$protectionBody = $protectionObject | ConvertTo-Json -Depth 6 -Compress:$false

Write-Host "Branch: ${owner}/${repo}@${branch}"
Write-Host "enforce_admins (from live, default true on read failure): $enforceAdmins"
Write-Host "Required checks ($($requiredContexts.Count)):"
foreach ($ctx in $requiredContexts) {
  Write-Host "  - $ctx"
}
Write-Host ""
Write-Host "PUT body:"
Write-Host $protectionBody

if ($WhatIf) {
  Write-Host ""
  Write-Host "WhatIf: not applying. Re-run without -WhatIf to PUT protection."
  exit 0
}

Write-Host ""
Write-Host "Applying branch protection..."

$protectionBody | gh api $protectionPath `
  --method PUT `
  --input -

if ($LASTEXITCODE -ne 0) {
  throw "Branch protection API call failed (exit $LASTEXITCODE)."
}

Write-Host "Branch protection applied successfully."
Write-Host "Verify with: gh api $protectionPath"
