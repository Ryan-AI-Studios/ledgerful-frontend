---
name: onboarding
description: Trigger this skill when starting a new session on the Ledgerful-frontend repo, when an agent needs orientation, or when asked "where do I start?", "what's the project state?", "how does work get done here?", or "onboard me". Also load when writing/reviewing TypeScript/React code, orchestrating tracks, or using research/CI tools. Loads once per session to establish context.
---

# Ledgerful Frontend Onboarding

You are working on **Ledgerful Frontend** — a local-first web dashboard for the Ledgerful change-intelligence engine (currently the Ledgerful Rust daemon). It is a separate repository from the Rust backend and communicates with it over a local HTTP/WebSocket API served at `localhost:52001`.

## What Ledgerful Frontend Does

Ledgerful Frontend turns backend intelligence into a fast, readable dashboard:

1. **Dashboard**: Project health score, drift/pending/risk summary, recent changes.
2. **Changes**: Dense table of recent changes with risk filters and diff metadata.
3. **Ledger**: Transactional provenance list, status, category, risk, and per-tx detail.
4. **Hotspots**: Complexity × frequency ranking with trend sparklines.
5. **Knowledge Graph**: Canonical table view of graph nodes (graph visualization ships later).
6. **Settings**: Read-only config display with JSON export.
7. **Projects**: Project switching with persistent active project.
8. **Status**: Backend system checks and daemon health.

## Current State

All v1 screens are implemented and build successfully:

| Screen | Status | Notes |
|---|---|---|
| Dashboard | Complete | Hero card, recent changes, states (loading/empty/error/ready) |
| Changes | Complete | Risk filters, time filters, dense table |
| Ledger | Complete | Search, category filter, detail page |
| Hotspots | Complete | Score ranking, sparkline trends |
| Graph | Complete | Canonical table view |
| Settings | Complete | Read-only config + Copy as JSON |
| Projects | Complete | Project switcher, persistent via localStorage |
| Status | Complete | System checks from backend |

## Authority Order

When sources conflict, higher wins:

1. **User/run prompt** — the current task instruction.
2. **`conductor/conductor.md`** — track registry and status.
3. **`conductor/<track>/spec.md`** — the track's definition of done.
4. **`conductor/<track>/plan.md`** — the track's phased checklist.
5. **`.agents/skills/implement/SKILL.md`** — the implementation workflow.
6. **This onboarding skill.**
7. **`AGENTS.md`** — top-level repo rules (verify, ledger, git, review, contracts).
8. **Docs and ledger history** — `C:\dev\coordinated\coordination.md`, `docs/product.md`, `docs/design.md`.
9. **External docs** — Next.js 16 bundled docs in `node_modules/next/dist/docs/`, Tailwind, web.

## Track History

The frontend repo has completed tracks 0001–0016. The backend repo (`C:\dev\ledgerful`)
has a longer history with different prefixes:

| Repo | Track prefixes | Scope |
|---|---|---|
| Frontend | 0001–0016 | Dashboard screens, API client, marketing site, contract alignment |
| Backend | 0–40, L1-1–L7-1, G1–G7, R1-1–R1-4, S1–S3, T1–T2, W1–W13, I/J/K/CG-F, M0–M10, DX1–DX7, E1–E3 | CLI, daemon, APIs, ledger, KG, impact, web server |

Frontend tracks often depend on backend tracks (e.g., 0016 aligns to backend E1/E2/E3).
Check `conductor/conductor.md` for the current registry and any `In Progress` track.

## Architecture at a Glance

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Shared UI components (PageLayout, tables, badges, cards)
├── lib/                 # Data services, types, project context
├── styles/              # Tailwind + CSS variables
public/
screenshots/             # Playwright-generated UI reference captures
```

## What to Do First (New Session)

1. Read `AGENTS.md` — project-specific instructions.
2. Read `.agents/skills/onboarding/SKILL.md` (this file) for workflow.
3. If present on this machine, read `C:\dev\coordinated\coordination.md` — backend author's notes for the frontend (constraints, contracts, gotchas). Skip if absent; not all contributors have the backend repo locally.
4. If present on this machine, read `C:\dev\Release-Implementation-Plan.md` — product/monetization roadmap shaping feature priorities. Skip if absent; treat as context only.
5. Run `npm install` if `node_modules` is missing.
6. Run `npm run build` to verify the project compiles.
7. Run `ledgerful doctor` (in the backend repo or if available here) to check daemon health.
8. Run `ledgerful ledger status` to check for pending transactions or drift.

## Quick Reference: Commands

```bash
# Development
npm run dev            # Start Next.js dev server on port 52001
npm run build          # Production build + type check
npm run lint           # ESLint

# Backend intelligence (from backend repo or daemon)
ledgerful doctor
ledgerful scan --impact
ledgerful ledger status --compact
ledgerful verify
ledgerful ledger commit <tx-id> --summary "..." --reason "..."
```

---

## TypeScript / React Coding Standards

### Retrieval Precedence

When researching before a code change, use this order:

1. **Active file / spec** — current code and task context.
2. **Project docs** — `PRODUCT.md`, `DESIGN.md`, `CLAUDE.md`, `AGENTS.md`.
3. **Ledger history** — `ledgerful ledger search` for architectural history.
4. **Local rules** — `.agents/rules/*.md`.
5. **Codebase search** — LSP/Grep for symbols, components, hooks.
6. **External** — Next.js docs, Tailwind docs, shadcn/ui patterns, web search.

### Language & Framework

- **Next.js**: 16 App Router, React Server Components by default.
- **TypeScript**: strict mode. Prefer explicit types on props and data services.
- **Styling**: Tailwind CSS with Ledgerful design tokens in `globals.css`.
- **Icons**: `lucide-react`.
- **State**: React hooks + Context. Persist project selection in `localStorage`.
- **Error handling**: No `console.log` in production paths; bubble errors to UI error states.

### Design System

- Dark-first, GitHub-dark surfaces.
- Single mint accent: `var(--color-primary)`.
- 8px grid, Inter + JetBrains Mono typography.
- Multi-cue risk indicators: color + icon + text.
- Native `<dialog>` for modals; no external UI library yet.

### Module Boundaries (SRP)

- `app/` — pages and layouts only. No business logic.
- `components/` — reusable UI. Page-specific components may live next to their page.
- `lib/` — data services, types, contexts, utilities.
- `lib/data*.ts` — mock services. Replace with real daemon calls incrementally.

### Anti-Overengineering (YAGNI)

- Do not add a state manager before component state is insufficient.
- Do not add a UI library until the native system breaks down.
- Do not build generic table abstractions with only one table.
- Do not fetch from the daemon until the mock is wired end-to-end.

### Traceability

Use `// @ledgerful-tx: <tx_id>` comments to link complex logic back to backend ledger transactions when the connection is non-obvious.

---

## Standard Operating Procedure

### 1. Planning Phase

1. Read `AGENTS.md` and `conductor/conductor.md`.
2. Run `ledgerful doctor` and `ledgerful ledger status`.
3. If backend changes are needed, do them in the **backend repo** first.
4. Update `conductor/conductor.md`: set the target track to **In Progress** and push.
5. Start a transaction: `ledgerful ledger start <feature> --category <CAT>`.

### 2. Implementation Phase (Multi-Agent)

This project uses a conductor-driven, multi-agent review workflow:

1. **Implement** — one subagent implements the track against its `spec.md` and `plan.md`.
2. **Review** — a second subagent reviews the implementation for correctness, design system conformance, and type safety.
3. **Address** — a third subagent addresses the review findings.
4. Be persistent: no placeholders or stubs are allowed in a Completed track.

### 3. Verification Phase

Run before any track gate is cleared:

```powershell
npm run build
npm run lint
npm run test:unit      # if test files touched
npm run test:e2e       # if UI flows touched
```

Also required:
- `codex review --uncommitted --title "..."` — captured to `output/review.md`.
- Subagent addresses all codex findings.
- Subagent verifies the codex fixes.
- A second `codex review` confirms no new critical/high findings.
- Manual end-to-end test of the feature in the browser.
- `ledgerful verify` if the backend contract changed.
- Playwright smoke screenshots for UI changes.

If any gate fails, fix it before moving on. Never use `--no-verify` unless the user explicitly requests it.

### 4. Finalization Phase

1. Mark track tasks `- [x]` in its `plan.md`.
2. Update `conductor/conductor.md`: set the track to **Completed**.
3. Commit with ledger: `ledgerful ledger commit <tx-id> --summary "..." --reason "..."`.
4. Push and confirm `ledgerful ledger status` is clean.
5. If there is no regression, proceed to the next track in `conductor/conductor.md`.

### Ledger Categories

| Category | When to use |
|---|---|
| `ARCHITECTURE` | Component boundaries, design system changes, new layout patterns |
| `FEATURE` | New dashboard screens, widgets, or user flows |
| `INFRA` | Next.js config, build setup, dependency upgrades |
| `SECURITY` | Secret handling, auth flows, CSP |
| `REFACTOR` | Internal cleanup without behavior change |
| `BUGFIX` | Defect corrections |
| `DOCS` | README, design docs, skill files |
| `CHORE` | Version bumps, lockfile updates, tooling maintenance |

---

## Tooling & Research Patterns

### Ledgerful Backend (separate repo)

Use Ledgerful commands against the backend repo or the running daemon:

| Phase | Command | Purpose |
|---|---|---|
| Session start | `ledgerful doctor` | Verify daemon/toolchain health |
| Before edits | `ledgerful scan --impact` | Detect drift and assess blast radius |
| After implementation | `ledgerful impact` | Full impact report |
| Before commit | `ledgerful verify` | Run verification plan |
| On commit | `ledgerful ledger commit` | Close transaction |
| Audit | `ledgerful ledger status` | Ensure clean baseline |

### GitHub CLI (`gh`)

- `gh run list` — check remote CI pipeline status after a push.
- `gh issue view <n>` — read requirements before starting work.
- `gh pr status` / `gh pr diff` — self-review before final verification.

### Codebase Search

Prefer LSP/Grep for frontend symbols, Ledgerful for backend symbols:

```bash
# Frontend symbols
npx tsc --noEmit   # type-check
# Use LSP/Grep for components, hooks, data services

# Backend intelligence (run in backend repo or against daemon)
ledgerful index --incremental
ledgerful search "symbol"
ledgerful ask "..."
```

---

## Invariants (Never Break)

- **No `any` in production code**. Use explicit types or `unknown` with guards.
- **No `console.log` in production code**. Use error states or a proper logger if needed.
- **Deterministic UI**: same project + same backend state → same rendered output.
- **Local-first**: dashboard renders with mock data when daemon is unavailable.
- **Windows paths**: preserve separators in displayed strings.
- **No secrets in commits**: never commit `.env`, credentials, or API keys.
- **No editing `.ledgerful/` state files** directly unless the user explicitly requests it.

## Key Reference Documents

- `docs/product.md` — Product strategy and personas.
- `docs/design.md` — Ledgerful design system (colors, typography, spacing, components, risk system).
- `AGENTS.md` — Top-level agent rules and verification commands for Claude Code.
- `.agents/skills/ledgerful/SKILL.md` — Backend Ledgerful command reference.
- `.agents/skills/codex-review/SKILL.md` — Cross-model review process.
- `.agents/skills/ai-brains/SKILL.md` — Memory and recall workflow.
- `C:\dev\coordinated\coordination.md` — Backend author's frontend-facing notes, constraints, and contracts.
- `C:\dev\Release-Implementation-Plan.md` — Monetization roadmap informing feature priorities.
