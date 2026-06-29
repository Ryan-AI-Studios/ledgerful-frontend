---
name: implement
description: Use when implementing one assigned conductor track end-to-end on the Ledgerful frontend. Load with onboarding. For concurrent non-intersecting implementation, use Appendix A. Conductor is source of truth for current tracks.
---

# Implement Conductor Track

identity{
  repo:"C:\dev\ledgerful-frontend"
  stack:"Next.js 16 + React 19 + TypeScript + Tailwind CSS v4"
  load_with:"onboarding"
  source_of_truth:"conductor/conductor.md + conductor/<track>/spec.md + conductor/<track>/plan.md"
  do_not:
    - clear gate with open critical/high findings
    - clear gate with unresolved regression caused by this work
}

mode{
  default:"serial single-agent"
  parallel:"Appendix A only"
  integration:"serial"
  clearance:"one integrated track/slice at a time"
}

loop[10]:
  - plan
  - start_tx
  - implement_tdd
  - targeted_checks
  - review
  - converge
  - manual_test
  - sync_contracts
  - full_gate
  - ledger_commit_and_conductor_update

plan{
  before_edit[6]:
    - read conductor/conductor.md
    - read conductor/<track>/spec.md
    - read conductor/<track>/plan.md
    - ledgerful ledger status --compact
    - ledgerful scan --impact (if backend touched)
    - read the relevant Next.js guide in node_modules/next/dist/docs/
  output_plan[6]:
    - affected files/modules (app/, components/, lib/)
    - expected behavior
    - proof tests/checks
    - dependency research needed (research pins online before adding/upgrading)
    - contract surfaces changed (types, mocks, coordination.md)
    - likely conflicts/shared files
  spec_vs_reality:
    rule:"follow actual code layout over aspirational spec paths"
    action:"note drift in plan.md; do not create fake modules solely to match spec"
  if_missing_spec_or_plan:
    create:
      - objective
      - requirements
      - API contracts
      - testing strategy
      - phased checklist
    conductor_status:"Planning"
}

implement{
  tdd_required:true
  red:"write failing tests asserting desired behavior (vitest); commit allowed"
  green:"write production code; commit allowed"
  after:"npm run build && npm run lint"
  intermediate_commits:"allowed"
  clean_gate_applies_to:"finalizing ledger commit"
  conventions:
    - no `any` in production code — use explicit types or `unknown` with guards
    - no `console.log` in production code — bubble errors to UI error states
    - no inline style props except for theming exceptions
    - Server Components by default; `"use client"` only when needed (state, events, browser APIs)
    - design-system conformance: no rounded-2xl, scale-105, shadow-xl decoration, gradient text, glassmorphism, emoji; mint accent only for actions/active; coral only for AI-attribution; risk colors only for risk
    - use lucide-react for icons (existing set; don't introduce a second)
    - use DESIGN.md tokens from globals.css — no new tokens without a DESIGN.md bump
}

research{
  stale_knowledge:true
  required_when:
    - Next.js 16 API behavior matters (read node_modules/next/dist/docs/)
    - React 19 behavior matters
    - Tailwind v4 behavior matters
    - crate/package API matters
    - version pin matters
    - docs could change implementation
  precedence:
    - active files/spec
    - conductor track
    - ledger history
    - local rules
    - repo docs (docs/product.md, docs/design.md, C:\dev\coordinated\coordination.md)
    - Next.js bundled docs (node_modules/next/dist/docs/)
    - context7 or web
  pins:
    - preserve existing pins unless necessary
    - update lockfiles intentionally
    - document version changes and sources
}

targeted_checks{
  run_before_full_gate:true
  examples:
    - npx tsc --noEmit
    - npm run lint -- <specific-files>
    - npm run test:unit -- <test-file>
}

review_convergence{
  file:"conductor/<track>/review.md"
  ledger_note:"review log is not ledgerful ledger"
  review_for:
    - correctness
    - TypeScript strictness (no `any`, proper optional/nullable handling)
    - React idioms (hooks deps, render safety, no undefined/NaN reaching DOM)
    - accessibility (WCAG 2.2 AA, focus rings, ARIA, multi-cue risk, keyboard nav)
    - design-system conformance (no rounded-2xl/scale-105/shadow-xl/gradient-text/glassmorphism/emoji; mint accent only for actions)
    - missing tests
    - edge cases
    - regressions
    - contract drift (types vs coordination.md vs mock vs live API)
  finding_fields:
    - id
    - severity
    - description
    - source
    - files
    - required_fix
    - status
    - evidence
  statuses:
    - open
    - fixed_pending_verification
    - verified_fixed
    - deferred
    - out_of_scope
  closure:
    - implementer may mark fixed_pending_verification
    - reviewer/self-reviewer/codex/claude may mark verified_fixed
    - code change alone is not closure
    - new findings enter same log
    - loop continues until clearance criteria met
  cross_model_review_required_when:
    - category is ARCHITECTURE
    - category is FEATURE
    - category is BUGFIX
    - impact riskLevel is High
    - broad temporal couplings
    - substantial multi-file refactor
    - pre-finalization on non-trivial work
  cross_model_method:"codex review --uncommitted (primary); claude -p fallback when codex exhausted (see codex-review SKILL.md)"
}

severity{
  critical:
    rule:"block; must be verified_fixed"
    examples:"data loss | security | broken core workflow | runtime crash in normal use | irreversible behavior"
  high:
    rule:"block; must be verified_fixed"
    examples:"regression | wrong business logic | broken public API/contract | major test gap | serious reliability issue | contract drift (undefined/NaN against live API)"
    regression_caused_by_work:"always high; never deferrable"
  medium:
    rule:"fix by default"
    may_defer_only_if:
      - not caused regression
      - one-line justification in review.md
      - tracked follow-up
      - cap <=3 deferred mediums per track
    examples:"edge-case gap | brittle impl | missing validation | non-idiomatic TypeScript | incomplete error handling | design-system minor violation"
  low_info:
    rule:"defer freely; note if useful"
}

manual_test{
  required_every_gate:true
  record_in:"plan.md or final report"
  required:
    - visible behavior
    - happy path
    - relevant error path
    - any prior regression path
    - exact command/input/output/result
  responsive:
    - test at mobile (375px), tablet (768px), desktop (1280px) if UI changed
    - keyboard nav: tab through nav, copy buttons, anchor links
    - focus-ring visibility check
    - contrast check on all text against surfaces
  screenshots:
    - use Playwright to capture desktop + mobile for changed pages
    - route through ui-specialist subagent for visual review (this model cannot read images)
}

full_gate{
  commands:
    - npm run build
    - npm run lint
    - npm run test:unit
    - npm run test:e2e (when page or interaction flows are touched)
  doctests:"n/a for frontend"
  ledgerful_verify:"only if backend contract changed"
  alias_unavailable:"fallback to native checks; report missing signal"
  never:"--no-verify unless user explicitly requests"
  codex_review:"codex review --uncommitted --title \"...\" 2>&1 | Out-File output/review.md (or claude -p fallback)"
  second_codex_review:"required before gate clearance on non-trivial work"
}

finalize{
  gate_clear_only_if:
    - no open critical/high
    - mediums fixed or justified-deferred with cap <=3
    - no unresolved regression caused by work
    - full gate green
    - manual evidence recorded
    - contracts synced (coordination.md + types + mocks)
    - conductor updated
    - ledger status clean after commit
  conductor:
    - mark plan.md tasks complete
    - set conductor/conductor.md entry Completed
    - add one-line evidence note
  ai_brains_pin_when:"architecturally non-obvious decision"
  pin_command:"ai-brains pin \"DECISION: <what + why>\" --tx-id <tx-id>"
}

unrelated_failures{
  rule:"triage; do not broadly clean up"
  fix_only_if:
    - obvious
    - low-risk
    - blocking validation
  handling:
    - keep separate commit where practical
    - document why unrelated
    - document why fix necessary
    - otherwise leave/report
}

stop_before:
  - destructive git operation
  - force-push
  - push to main/master
  - missing secrets
  - unavailable external service with no documented mock
  - ambiguous/conflicting specs not resolvable from code+plan
  - broad unrelated failures
  - unsafe required dependency upgrade
  - scope exceeds current track

final_report{
  include:
    - tracks completed
    - files changed
    - checks/tests/manual evidence with exact commands
    - review-log summary by severity
    - deferred mediums with justifications
    - contracts synced
    - dependency docs/versions consulted
    - commits and push status
    - residual risks/follow-ups
}

appendix_A_parallel_agents{
  use_when:"two or more implementation agents edit code concurrently"
  skip_when:"normal serial run"
  max_concurrent:3
  allowed_if:
    - scopes are genuinely non-intersecting
    - each agent has own branch
    - each agent has own git worktree
    - no same files/modules
    - no conflicting shared API changes
  parallel_agents_must_not_touch:
    - conductor.md
    - package.json
    - package-lock.json
    - next.config.ts
    - globals.css (design tokens)
    - shared types (src/lib/types.ts)
    - CI config
  coordinator_owns:
    - integration
    - conductor updates
    - dependency/config/lockfile changes
    - shared type changes
    - ledger finalization
    - commits/pushes
  commands:
    - git worktree add ..\ledgerful-frontend-<track> -b agent/<track>
  integration:
    - merge/cherry-pick one branch at a time
    - prefer smallest clean diff
    - run full gate after each integration
    - clear one gate at a time
    - track not clear until integrated, reviewed, manually tested, recorded
    - abandon/delete rejected or integrated worktrees
}