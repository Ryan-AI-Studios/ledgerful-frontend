# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

repo{
  name:"Ledgerful Frontend"
  os:"Windows"
  goal:"scoped edits; verified behavior; clean provenance"
}

onboarding{
  skill:".agents/skills/onboarding/SKILL.md"
}

ledgerful{
  before[6]:
    "changeguard doctor to verify the daemon/backend is healthy at session start"
    "changeguard audit at session start for project health"
    "changeguard ledger status --compact"
    "read conductor/conductor.md for the active track and definition of done"
    "changeguard scan --impact for meaningful code/config/policy edits"
    "read .changeguard/reports/latest-impact.json if present"
  edit[4]:
    "do not edit .changeguard state files"
    "inspect hotspots surfaced by the backend"
    "inspect temporal couplings >70% reported by the backend"
    "research current documentation and pins online before adding or upgrading outside dependencies"
  after[3]:
    "npm run build must pass after TypeScript/Next.js edits"
    "npm run lint or next lint must pass"
    "report risk, verification, pending tx, drift from changeguard"
  skip[5]:
    "format-only"
    "scratch files"
    "binary/media-only"
    "lockfile-only dependency churn"
    "explicit user bypass"
  fail{
    unavailable:"continue with native checks; report missing signals"
    drift:"reconcile/adopt in the backend repo before continuing unless user says otherwise"
    verify:"report exact failed command and continue with justified fallback"
  }
}

workflow{
  mode:"conductor-driven multi-agent review"
  summary:"Pick a track from conductor/conductor.md, implement it with subagents, review, codex review, test, and close the gate before moving on."
  steps[10]:
    "update conductor/conductor.md: set track status to In Progress, ensure spec.md and plan.md are current"
    "push the conductor update so all agents see the same plan"
    "implement the track: one subagent implements, another subagent reviews the implementation, a third addresses review findings"
    "run codex review on the uncommitted diff; capture output to output/review.md"
    "have a subagent address all codex findings"
    "have a subagent review the fixes to confirm findings are properly addressed"
    "run codex review again before the gate is cleared"
    "manually test the feature end-to-end in the browser or with the appropriate test command"
    "run the full verification gate: npm run build, npm run lint, npm run test:unit, npm run test:e2e if UI flows touched"
    "update conductor/conductor.md to Completed, commit the ledger transaction, push; if no regression, proceed to the next track"
  rules[4]:
    "no placeholders or stubs ship in a Completed track"
    "be persistent: keep iterating through review/codex/test cycles until the gate passes"
    "research current documentation and dependency pins online before introducing or upgrading external packages"
    "every gate failure must be resolved before moving to the next track"
}

ledger{
  start:"changeguard ledger start <entity> --category <CATEGORY> --message <intent>"
  commit:"changeguard ledger commit <tx-id> --summary <what> --reason <why>"
  close_gate:"a track is not ledger-committed until implementation review, codex review, manual test, and npm build/lint/test all pass"
  no_placeholders:"do not commit a track as Completed if it still contains TODOs, stubs, or placeholder components"
  hooks[2]:
    "pre-commit: changeguard ledger status --compact --exit-code"
    "pre-push: changeguard ledger status --compact --exit-code"
  stale_sidecar:"after git commit, if ledger status shows 1 pending, run ledger commit immediately; the hook removes the sidecar before post-commit can promote it"
}

verify{
  scope:"targeted during work; full gates before a track is marked Completed"
  commands[4]:
    "npm run build"
    "npm run lint"
    "npm run test:unit (when test files are touched)"
    "npm run test:e2e (when page or interaction flows are touched)"
  review[4]:
    "subagent implementation review: one subagent reviews another's implementation"
    "subagent fix verification: a third subagent confirms review findings are addressed"
    "codex review before gate: codex review --uncommitted --title \"...\" 2>&1 | Out-File output/review.md"
    "manual end-to-end test of the feature in the browser or appropriate test command"
  hygiene[2]:
    "no secrets or .env commits"
    "scratch and temporary review files belong in output/ and must be removed or gitignored before finish"
}

frontend{
  framework:"Next.js 16 + React + TypeScript + Tailwind CSS"
  app_router:true
  port:"52001"
  forbid[3]:
    "any in production code"
    "console.log in production code"
    "inline style props except for theming exceptions"
  boundaries[2]:
    "src/components owns UI components"
    "src/lib owns data services and types"
  invariants[2]:
    "dashboard works offline with mock data fallback"
    "preserve Windows paths in displayed strings"
}

kg{
  backend:"CozoDB via changeguard daemon"
  state:".changeguard/state/ledger.cozo in the backend repo"
  use[8]:
    "changeguard search for high-precision regex/text discovery (prefer over grep)"
    "changeguard ask --semantic for conceptual discovery (prefer over semantic search)"
    "changeguard ask for architecture/codebase questions in the backend repo"
    "changeguard index --incremental before any search/ask or after pulling changes"
    "changeguard dead-code before cleanup sprints in the backend repo"
    "changeguard data-models list before schema changes"
    "changeguard config verify after config changes"
    "changeguard viz for deep architecture review"
  surfaces[8]:
    "changeguard endpoints --changed / --json"
    "changeguard services diff"
    "changeguard data-models impact --changed"
    "changeguard config schema / config diff"
    "changeguard observability diff / observability coverage"
    "changeguard hotspots trend / hotspots explain"
    "changeguard security boundaries / security impact --changed"
    "changeguard ledger graph <tx-id>"
}

powershell{
  forbid[7]:"&&","[[","]]","then","fi","done","echo -e"
  prefer[6]:"Get-ChildItem","Get-Content","Test-Path","Join-Path","Copy-Item","Remove-Item"
  rules[3]:
    "use $_ and object properties for pipelines"
    "use backslashes for shell-level Windows paths"
    "avoid Bash shims for complex logic"
}

aibrains{
  preflight:"session start briefing: run 'ai-brains preflight --summary'"
  pre_edit:"check constraints before risky edits: run 'ai-brains preflight --summary'"
  unified_search:"query memory + code symbols: run 'ai-brains sync query \"<query>\"'"
  recall:"query past decisions only: run 'ai-brains recall \"<query>\" --semantic'"
  pin:"persist decisions/constraints: run 'ai-brains pin \"<DECISION/CONSTRAINT/HOTSPOT: message>\"'"
}

git{
  forbid[4]:
    "push to main/master without a clean ledger"
    "force-push without explicit approval"
    "destructive operations without explicit approval"
    "committing secrets/.env"
  require[4]:
    "inspect diff before commit"
    "commit only intentional files"
    "keep unrelated fixes separate where practical"
    "clear ledger status before push"
}

review{
  log:"conductor/<track>/review.md"
  critical_high:"must be verified_fixed before clearance"
  regression_caused_by_work:"high; never deferrable"
  medium:"fix by default; defer only with one-line justification in review.md, cap <=3 deferred per track"
  closure:"code change alone is not closure — finding must be verified_fixed by a subagent or cross-model reviewer"
}

contracts{
  required_when[3]:
    "/api/* payload shape changed"
    "backend track adds/renames/removes a field the frontend renders"
    "mock service shape diverges from live API shape"
  update[3]:
    "docs/Backend-Notes.md (the frontend's reverse-contract for the backend)"
    "C:\dev\ChangeGuard\docs\Frontend-Notes.md (the backend's notes for the frontend)"
    "affected frontend types/components/mocks"
  missing:"high finding in review.md — contract drift is a P1 minimum"
  template:"E1/E2 ripple: backend renames a field → frontend type, component, mock, and Backend-Notes §3 must all update in the same track"
}

stop_before[8]:
  "destructive git operation"
  "force-push"
  "push to main/master without clean ledger"
  "missing secrets or .env in commit"
  "unavailable external service with no mock fallback"
  "ambiguous/conflicting specs not resolvable from code+plan"
  "broad unrelated failures beyond the current track scope"
  "scope exceeds the current track's spec.md"

unrelated_failures{
  rule:"triage; do not broadly clean up"
  fix_only_if[3]:
    "obvious"
    "low-risk"
    "blocking validation"
  otherwise:"document in review.md and report"
  commit:"separate where practical"
}
