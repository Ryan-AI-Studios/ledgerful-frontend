# Track PLAN: 0020-LayoutRhythmAndMotion — Layout Rhythm + Motion Polish

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md` (with 0017's
      register split and 0018's hero restructure in place).
- [ ] Read `conductor/0018-HeroProofLayer/spec.md` and
      `conductor/0019-TrustAndSocialProof/spec.md` — confirm
      dependencies are landed.
- [ ] Read `.agents/skills/impeccable/SKILL.md` — motion rules,
      absolute bans (eyebrows, identical card grids, ghost-card borders).
- [ ] Check `package.json` for `motion` / `framer-motion` / `motion/react`.
      If absent, research current version online and install, OR plan
      for IntersectionObserver + CSS transitions (zero-dependency).
- [ ] Read `C:\dev\output\visual-review.md` for the four findings this
      track addresses (twin grids, mobile H1 span break, motion absence,
      eyebrow inconsistency).
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Decide twin-grid break strategy per section (Three Questions →
      2-col split? Distribution Channels → tabbed or 2-row table? Or
      merge?).
- [ ] Confirm H1 span fix approach: `white-space: nowrap` on emerald
      span vs `display: inline-block`. Test both at 320px.
- [ ] Confirm motion approach: library (Motion for React) vs
      IntersectionObserver + CSS. Pick based on dependency policy.
- [ ] Confirm eyebrow removal: remove both, fold load-bearing copy into
      H2 or section body.
- [ ] Confirm card hover lift selector: which elements get the lift
      (remaining cards only, not the hero TerminalReceipt).

## Phase 3: Implementation

- [ ] Step 1: Break the "Three Questions" grid into a 2-column split
      (stacked list left, supporting visual/quote right) OR chosen
      strategy from Phase 2.
- [ ] Step 2: Break the "Distribution Channels" grid into a tabbed
      surface or 2-row table OR chosen strategy.
- [ ] Step 3: Apply H1 span fix — `white-space: nowrap` (or chosen
      approach) on the emerald `impacts` span. Test at 320, 375, 390,
      414px. No horizontal overflow.
- [ ] Step 4: Install motion library if chosen, OR create a `Reveal`
      component using `IntersectionObserver` + CSS transitions.
- [ ] Step 5: Wrap content sections (SignedReceipt, Three Questions,
      Distribution Channels, Closing CTA) in `Reveal`. Default state
      visible (opacity 1, translateY 0); animation is progressive
      enhancement.
- [ ] Step 6: Implement `useReducedMotion` check — skip animation
      entirely if reduced motion is preferred.
- [ ] Step 7: Add card hover lift (`hover:-translate-y-0.5
      transition-transform duration-100 ease-out`) to remaining cards.
      Not on hero TerminalReceipt.
- [ ] Step 8: Add CopyCommand copy-flash — mint border flash for 150ms
      on copy success.
- [ ] Step 9: Remove both eyebrows ("THE ANSWER IN 2 SECONDS",
      "CRYPTOGRAPHY WITHOUT CEREMONY"). Fold load-bearing copy into H2
      or section body if needed.
- [ ] Step 10: Section rhythm pass — vary vertical spacing between
      sections (not all `py-16 md:py-20`).

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm run test:unit` (if motion component has tests)
- [ ] Manual scroll test on desktop (1440x900):
      - No two identical 3-card grids in a row.
      - Fade-up reveals fire once, do not re-fire on scroll-back.
      - Card hover lifts 1-2px, no scale or shadow change.
      - CopyCommand flashes mint on copy.
      - No eyebrows above sections.
      - Section spacing varies.
- [ ] Manual scroll test on mobile (390x844):
      - Emerald `impacts` span stays on one line at 320, 375, 390, 414.
      - No horizontal overflow.
      - Motion targets readable.
- [ ] Manual reduced-motion test (DevTools > Rendering > Emulate
      `prefers-reduced-motion: reduce`):
      - All motion skipped.
      - Content immediately visible (no hidden sections).
- [ ] ui-specialist screenshots at 1440x900 and 390x844, default and
      reduced-motion → `C:\dev\output\ledgerful-0020-{desktop,mobile}-{default,reduced}.png`.
- [ ] `codex review --uncommitted --title "0020 layout rhythm and motion"` →
      `C:\dev\output\review-0020.md`
- [ ] Subagent addresses codex findings.
- [ ] Subagent verifies fixes.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] `changeguard verify` — skipped, no backend contract changed.

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.