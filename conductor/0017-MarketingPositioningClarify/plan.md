# Track PLAN: 0017-MarketingPositioningClarify — Positioning + Register Split

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Read `conductor/0015-MarketingSiteRedesign/spec.md` for the prior
      track's intent (this track refines, does not revert).
- [ ] Read `C:\dev\output\visual-review.md` for the ui-specialist findings.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm H1 copy: `Know what your change impacts — before review.`
- [ ] Confirm subhead copy (agentic-engineering paragraph).
- [ ] Confirm closing CTA copy: `Install in 60 seconds. Map your first
      change in under five.`
- [ ] Confirm canonical tagline: `Ledgerful — the intent ledger for
      agentic engineering.`
- [ ] Confirm register-split language for DESIGN.md.
- [ ] Confirm positioning statement for `docs/product.md`.
- [ ] Grep the repo for `AI-assisted|AI powered|Revolutionizing|next
      generation of software` to scope the copy audit.

## Phase 3: Implementation

- [ ] Step 1: Add the "## Registers" section to `docs/design.md`
      (marketing register vs product register, shared invariants).
- [ ] Step 2: Add the "## Positioning" section (or append to Product
      Purpose) in `docs/product.md` with the category statement.
- [ ] Step 3: Rewrite the hero H1 in `src/app/page.tsx` to the single
      promise; emerald span wraps `impacts` only (no `<br/>` between
      slogan lines).
- [ ] Step 4: Rewrite the hero subhead to the agentic-engineering
      paragraph.
- [ ] Step 5: Rewrite the closing CTA copy in `src/app/page.tsx`.
- [ ] Step 6: Audit `src/app/page.tsx`, `src/app/pricing/page.tsx`,
      `src/app/docs/page.tsx`, `src/components/MarketingLayout.tsx` for
      AI-assisted / vague-AI copy; replace with ledger-as-source-of-truth
      framing.
- [ ] Step 7: Update `src/app/layout.tsx` `metadata.description` to the
      canonical tagline.
- [ ] Step 8: Update `src/components/MarketingLayout.tsx` footer tagline
      to the canonical version.
- [ ] Step 9: Verify "Request demo" remains only on the Enterprise
      pricing tier (no landing-page "Book a Demo").

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] Grep `src/app/` and `src/components/` for `AI-assisted|AI powered|
      Revolutionizing|next generation of software` — zero hits.
- [ ] Manual read-through: landing, pricing, docs at desktop (1280px) and
      mobile (390px). Confirm H1 reads as one promise, emerald on
      `impacts` only, closing CTA concrete, footer canonical.
- [ ] `codex review --uncommitted --title "0017 marketing positioning
      clarify"` → `C:\dev\output\review-0017.md`
- [ ] Subagent addresses codex findings.
- [ ] Subagent verifies fixes.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] `changeguard verify` — skipped, no backend contract changed.

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.