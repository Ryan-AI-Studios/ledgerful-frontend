#requires -Version 7.2

# Staged branch-protection configuration for Ryan-AI-Studios/ledgerful-frontend.
# This script is idempotent: it PUTs the current desired state.
#
# IMPORTANT: GitHub branch-protection API returns 403 on private repos without
# GitHub Pro. This script is therefore staged but not applied now. Run it once
# the repo is public or the owner/org upgrades to Pro.

$ErrorActionPreference = 'Stop'

$owner = 'Ryan-AI-Studios'
$repo = 'ledgerful-frontend'
$branch = 'main'

$protectionBody = @"
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "CI / build",
      "security/npm-audit",
      "security/gitleaks",
      "security/semgrep",
      "ai-reviewed"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
"@

# NOTE: Solo/AI workflow: no PR review requirement (owner is sole contributor).
# Protection is checks-based only. Admin bypass is allowed (enforce_admins:false)
# so the owner is never locked out by a pending or flaky check.

# NOTE: Check names must match GitHub's emitted `<workflow_name> / <job_key_or_name>`
# exactly. Verify by checking the Actions tab after a run before applying protection.
# `CI / build` comes from workflow `name: CI` in ci.yml and job key `build`.
# `security/*` names match the explicit `name:` fields in security.yml.
# `ai-reviewed` is created via the GitHub Statuses API context field.

Write-Host "Applying branch protection to ${owner}/${repo}@${branch}..."

$protectionBody | gh api "repos/${owner}/${repo}/branches/${branch}/protection" `
  --method PUT `
  --input -

if ($?) {
  Write-Host 'Branch protection applied successfully.'
}
else {
  throw 'Branch protection API call failed. On a private repo without GitHub Pro this is expected (403).'
}
