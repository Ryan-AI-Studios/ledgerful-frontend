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
  before[5]:
    "changeguard doctor to verify the daemon/backend is healthy at session start"
    "changeguard audit at session start for project health"
    "changeguard ledger status --compact"
    "changeguard scan --impact for meaningful code/config/policy edits"
    "read .changeguard/reports/latest-impact.json if present"
  edit[3]:
    "do not edit .changeguard state files"
    "inspect hotspots surfaced by the backend"
    "inspect temporal couplings >70% reported by the backend"
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

ledger{
  start:"changeguard ledger start <entity> --category <CATEGORY> --message <intent>"
  commit:"changeguard ledger commit <tx-id> --summary <what> --reason <why>"
  hooks[2]:
    "pre-commit: changeguard ledger status --compact --exit-code"
    "pre-push: changeguard ledger status --compact --exit-code"
  stale_sidecar:"after git commit, if ledger status shows 1 pending, run ledger commit immediately; the hook removes the sidecar before post-commit can promote it"
}

verify{
  scope:"targeted during work; full commands before commit"
  commands[4]:
    "npm run build"
    "npm run lint"
    "npm run test:unit (when test files are touched)"
    "npm run test:e2e (when page or interaction flows are touched)"
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
