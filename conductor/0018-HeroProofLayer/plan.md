# Track PLAN: 0018-HeroProofLayer — Hero Restructure + Proof Promotion

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md` (with 0017's
      register split now in place).
- [ ] Read `conductor/0017-MarketingPositioningClarify/spec.md` — confirm
      H1 and subhead copy are landed before this track starts.
- [ ] Read `src/components/marketing/TerminalReceipt.tsx` and
      `src/components/marketing/SignedReceipt.tsx` for current props and
      responsive behavior.
- [ ] Read `C:\dev\output\visual-review.md` for the hero findings.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm grid ratio: `lg:grid-cols-[3fr_2fr]` (60/40).
- [ ] Confirm CTA labels: `Get started` (primary), `Read the docs`
      (secondary).
- [ ] Confirm CTA destinations: primary → `#install` anchor or `/docs`;
      secondary → `/docs`.
- [ ] Confirm section reorder: Hero → SignedReceipt → Three Questions →
      Distribution Channels → Closing CTA.
- [ ] Decide eyebrow placement: "THE ANSWER IN 2 SECONDS" either stays
      above the hero TerminalReceipt (desktop only) or moves to caption
      the SignedReceipt section.

## Phase 3: Implementation

- [ ] Step 1: Restructure `src/app/page.tsx` hero into `lg:grid-cols-[3fr_2fr]`
      grid. Left: H1 (from 0017), subhead (from 0017), CTA row, install
      chip, "no egress" line. Right: `<TerminalReceipt />`.
- [ ] Step 2: Add filled mint `Get started` primary button
      (`buttonPrimary` tokens) and ghost `Read the docs` secondary button
      (`buttonSecondary` tokens). Mobile: stack vertically; desktop: row.
- [ ] Step 3: Remove "View pricing" text link from hero. Move install
      chip below the CTA row with a muted "or install the CLI" label.
- [ ] Step 4: Remove the old section 2 wrapper around TerminalReceipt
      (it's now in the hero). Preserve the "The answer in 2 seconds"
      eyebrow + heading — relocate per Phase 2 decision.
- [ ] Step 5: Move the SignedReceipt section to position 2 (directly
      under hero). Keep its eyebrow + heading + body copy.
- [ ] Step 6: Verify section order in `page.tsx`: Hero → SignedReceipt →
      Three Questions → Distribution Channels → Closing CTA.
- [ ] Step 7: Responsive pass — test TerminalReceipt readability at 390,
      768, 1024. Adjust font scale or container overflow if needed
      (prefer `overflow-x-auto` on the receipt container over font
      shrink).

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] Manual responsive: 390, 768, 1024, 1280, 1440, 1920. No horizontal
      overflow; TerminalReceipt readable at all sizes; hero stacks below
      `lg`.
- [ ] Manual keyboard nav: tab order H1 → primary CTA → secondary CTA →
      install chip → TerminalReceipt. Focus rings visible.
- [ ] Manual contrast check: filled button (inverse on mint).
- [ ] ui-specialist screenshots at 1440x900 and 390x844 →
      `C:\dev\output\ledgerful-0018-{desktop,mobile}.png`.
- [ ] `codex review --uncommitted --title "0018 hero proof layer"` →
      `C:\dev\output\review-0018.md`
- [ ] Subagent addresses codex findings.
- [ ] Subagent verifies fixes.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] `changeguard verify` — skipped, no backend contract changed.

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.