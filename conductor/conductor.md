# Conductor: Ledgerful Frontend

The conductor/track system structures incremental delivery for the Ledgerful Next.js dashboard. Each track lives in `conductor/{trackId}/` and has:

- `spec.md` — objective, requirements, contracts, testing strategy
- `plan.md` — phased checklist using `- [ ]` / `- [x]` task lists

## Track Naming Convention

All tracks use the format:

```
{####}-{Description}
```

- `####` — zero-padded sequential number (e.g., `0001`, `0002`).
- `Description` — short PascalCase or kebab-case summary (e.g., `DaemonAPIClientLayer`, `daemon-api-client-layer`).

Examples:
- `0001-DaemonAPIClientLayer`
- `0002-HotspotsAndTrends`
- `0003-UserMenu`

Use this convention for every new track. Do not use `F-1`, `track-1`, or other formats.

## Track Definition of Done

Every track's `spec.md` must include a **Definition of Done** section. Before a track can be marked **Completed**, all items in that section must be checked. The project uses a multi-agent review workflow (see `AGENTS.md` `workflow` block). At minimum this includes:

- No placeholders or stubs remain in the implementation.
- Implementation reviewed by a subagent.
- Review findings addressed and verified by a subagent.
- `codex review` run on the uncommitted diff; findings addressed.
- Second `codex review` confirms no new critical/high findings.
- Manual end-to-end test of the feature passed.
- `npm run build` passes.
- `npm run lint` passes.
- Manual click-through / screenshots captured if UI changed.
- Registry status updated to **Completed**.
- `changeguard ledger status --compact` is clean (no uncommitted transaction or drift) unless intentionally pending.

Add track-specific criteria (tests, backend contract alignment, accessibility checks, etc.) in each `spec.md`.

## Track Registry

| Track | Status | Owner | Summary |
|---|---|---|---|
| 0001-DaemonAPIClientLayer | Planning | — | Daemon API client layer |
| 0002-HotspotsAndTrends | Planning | — | Real-time hotspots and 90-day trends |
| 0003-UserMenu | Planning | — | User menu and session surface |
| 0004-GraphVisualizationCanvas | Planning | — | Interactive knowledge-graph canvas |
| 0005-ResponsiveMobilePass | Planning | — | Responsive layout and mobile pass |
| 0006-ComplianceHub | Planning | — | SOC2 evidence export and signature validation |
| 0007-VerificationHistory | Planning | — | Verification pass/fail trends and health |
| 0008-MarketingSite | Planning | — | Landing, pricing, and docs shell |

## Completed Tracks

| Track | Completed | Summary |
|---|---|---|
| v1 | 2026-06-15 | Dashboard, Changes, Ledger, Hotspots, Graph, Settings, Projects, Status screens. Project switching. Design system. |

## Ledger Categories

Use these when starting a ChangeGuard transaction for a track:

| Category | Use for |
|---|---|
| ARCHITECTURE | Component boundaries, design system changes, new layout patterns |
| FEATURE | New dashboard screens, widgets, or user flows |
| INFRA | Next.js config, build setup, dependency upgrades |
| SECURITY | Secret handling, auth flows, CSP |
| REFACTOR | Internal cleanup without behavior change |
| BUGFIX | Defect corrections |
| DOCS | README, design docs, skill files, conductor updates |
| CHORE | Version bumps, lockfile updates, tooling maintenance |

## How to Start and Close a Track

1. Read this file.
2. Run `changeguard ledger status --compact`.
3. Pick the next `Planning` track from the registry.
4. Copy `conductor/templates/track-0000-Description/spec.md` and `plan.md` into `conductor/<trackId>/`.
5. Update this registry: set track status to **In Progress**.
6. Push the conductor update so all agents see the same plan.
7. Start a transaction: `changeguard ledger start conductor/<trackId> --category <CATEGORY> --message "..."`.
8. Implement the track using the multi-agent workflow in `AGENTS.md`:
   - subagent implements
   - subagent reviews
   - subagent addresses findings
   - codex review
   - subagent addresses codex findings
   - subagent verifies fixes
   - final codex review before gate
   - manual end-to-end test
9. Mark tasks `- [x]` in `plan.md`, set registry status to **Completed**.
10. Commit with `changeguard ledger commit <tx-id> ...` and push.
11. If there is no regression, proceed to the next track.
