# Track PLAN: 0015-MarketingSiteRedesign — Brand-Voice Marketing Site

## Phase 1: Discovery

- [x] Read `conductor/conductor.md` for context.
- [x] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [x] Read the monetization roadmap pricing tiers and distribution channels.
- [x] Read `C:\dev\ChangeGuard\docs\Frontend-Notes.md` for backend constraints.
- [x] Run `npm run build` to confirm baseline compiles (pending).

## Phase 2: Design / Spec

- [x] Confirm brand: Ledgerful.
- [x] Confirm pricing: roadmap (Free / Pro $19 / Enterprise $99).
- [x] Confirm visual direction: committed-dark, single-mint,
      terminal-as-evidence.
- [x] Brief confirmed by user.

## Phase 3: Implementation

- [x] Step 1: Rebuild `MarketingTopNav` — mint active underline, Dashboard
      secondary link, Get Started primary CTA, mobile collapse.
- [x] Step 2: Rebuild `MarketingLayout` — skip link, footer without social
      icons.
- [x] Step 3: Build shared marketing components — `TerminalReceipt` (the
      `ledgerful scan` output panel), `SignedReceipt` (sample transaction),
      `CopyCommand` (install command with 3-state copy feedback), `DocsSidebar`
      (collapsible mobile nav).
- [x] Step 4: Rebuild landing page (`src/app/page.tsx`) — hero, terminal
      receipt, three-questions, signed receipt, distribution channels, CTA.
- [x] Step 5: Rebuild pricing page (`src/app/pricing/page.tsx`) — roadmap
      tiers, comparison matrix (desktop table + mobile stacked accordions),
      FAQ, Request demo CTA.
- [x] Step 6: Rebuild docs shell (`src/app/docs/page.tsx`) — sticky left
      rail (mobile-collapsible), quick-start, real commands, anchor links.
- [x] Step 7: Responsive pass — mobile (375px), tablet (768px), desktop
      (1280px). Visual review via ui-specialist subagent screenshots.

## Phase 4: Verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] Manual click-through / screenshots (desktop + mobile) via ui-specialist
- [x] Visual iteration: P0/P1/P2 defects found by ui-specialist, patched,
      re-verified
- [x] Keyboard nav + focus-ring check (build + lint clean)
- [x] Contrast check on all text (bumped muted → secondary where flagged)
- [x] `codex review --uncommitted` → `output/review.md`
- [x] Subagent addresses codex findings (P2 onboarding portability, P3 CopyCommand 3-state, P3 docs anchor)
- [x] Second `codex review` (P3 stub nav items → removed, real anchors added)
- [x] `changeguard verify` — skipped, no backend contract changed (spec §API / Data Contracts: "No new API contracts. All marketing content is static.")

## Phase 5: Finalization

- [x] Mark this track Completed in `conductor/conductor.md`.
- [x] Commit with `changeguard ledger commit cb467e50-1005-40af-bf83-9cf1ef3a7322` (git commit db41328; stale sidecar 3d670d0c committed post-commit).
- [x] Run `changeguard ledger status --compact` to confirm clean.