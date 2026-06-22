# Track SPEC: 0020-LayoutRhythmAndMotion — Layout Rhythm + Motion Polish

## Objective

Fix the remaining visual-defect findings from the ui-specialist review:
break the twin identical 3-card grids, fix the mobile H1 color-span break,
add restrained scroll-triggered motion, and make the eyebrow decision
consistently. This is the polish layer that moves the site from
"developer-tool v1" to "Linear-grade polish."

Depends on: **0018-HeroProofLayer** (the hero restructure must be in place
so motion targets and section rhythm are stable) and ideally
**0019-TrustAndSocialProof** (so the logo strip is part of the rhythm
calculation, not an afterthought).

## Why This Matters

The ui-specialist review (`C:\dev\output\visual-review.md`) flagged four
medium-to-high findings that 0017-0019 don't address:

1. **Twin 3-card grids back-to-back.** "Three questions git can't answer"
   and "Distribution channels" are visually identical 3-card grids
   stacked with no rhythm break. This is the most-recognized AI-generated
   SaaS layout of 2026 — the impeccable skill lists "identical card
   grids" as an absolute ban.
2. **Mobile H1 color-span break.** The emerald "Cryptographic provenance"
   span wraps mid-phrase on 390px, splitting the brand color across two
   lines. 0017's new H1 (`Know what your change impacts — before review`)
   has the same risk if `impacts` wraps mid-word.
3. **Motion absence.** The page is fully static. Linear, Vercel, and
   Graphite all use 150-300ms in-view reveals. Static pages feel
   unfinished in 2026.
4. **Eyebrow inconsistency.** "THE ANSWER IN 2 SECONDS" and "CRYPTOGRAPHY
   WITHOUT CEREMONY" appear on 2 of 4 content sections — reads template,
   not brand. The impeccable skill flags "tiny uppercase tracked eyebrow
   above every section" as a tell, but having it on *some* sections is
   worse than either always-on or always-off.

## Requirements

### Must Have

- **Break the twin 3-card grids.** At least one of the two 3-card grids
  ("Three questions" or "Distribution channels") must change layout so
  they are no longer visually identical back-to-back. Options (pick one
  per grid, implementer's call based on content fit):
  - **Three Questions → 2-column split.** Left column: the three
    questions as a stacked list (number + question + answer, hairline
    separators between). Right column: a single supporting visual or
    pull-quote. This breaks the 3-up grid and gives the section
    editorial weight.
  - **Distribution Channels → tabbed surface or 2-row table.** Either
    a tabbed view (MCP / GitHub / Local — click to switch, showing one
    at a time with its content) or a 2-row table (Surface | Delivers |
    Where it lands). Both break the 3-up grid pattern.
  - **Or: merge the two sections.** If the content supports it, fold
    the distribution channels into the three-questions section as the
    "where it lands" answer to a fourth question. Reduces two
    near-identical sections to one.
  The goal: when a user scrolls past the hero and SignedReceipt, they
  do not see two identical 3-card grids in a row.
- **Fix mobile H1 color-span break.** Apply CSS to the emerald `impacts`
  span in the H1 so it cannot break mid-phrase on narrow viewports:
  - `white-space: nowrap` on the emerald span itself, OR
  - `display: inline-block` on the span with `text-wrap: balance` on the
    parent H1 (already present), so the span acts as an atomic unit.
  Test at 320px, 375px, 390px, 414px. The emerald word must stay on one
  line. If it causes the H1 to overflow horizontally at 320px, reduce
  the H1 `clamp()` max or shorten copy (coordinate with 0017 if copy
  change is needed; 0017's copy should permit this without change).
- **Add restrained scroll-triggered motion.** Use the `motion` library
  (or Framer Motion / Motion for React, per availability — check
  `package.json`) to add in-view fade-up reveals on the content sections
  (SignedReceipt, Three Questions, Distribution Channels, Closing CTA).
  Spec:
  - Duration: 200-300ms.
  - Easing: ease-out-quart or ease-out-expo (exponential, per impeccable
    skill — no bounce, no elastic).
  - Distance: 8-12px translateY only (no scale, no blur).
  - Trigger: element enters viewport at 15-20% from bottom.
  - `once: true` — do not re-animate on scroll-back.
  - Honor `prefers-reduced-motion`: if reduced, the section renders at
    full opacity with no transform (no transition). The existing
    `globals.css` reduced-motion block handles CSS transitions; for JS
    motion, check `window.matchMedia('(prefers-reduced-motion: reduce)')`
    and skip the animation.
  - **Critical per impeccable skill:** "Reveal animations must enhance an
    already-visible default. Don't gate content visibility on a
    class-triggered transition." Default state must be visible (opacity
    1, translateY 0); the animation is a progressive enhancement. If JS
    fails or is slow, content is visible.
- **Card hover lift (subtle).** On the remaining cards (whichever grid
  survives, plus any other card-like surfaces), add a 1-2px translateY on
  hover with 100ms ease-out. No scale, no shadow change, no border
  change. This is a state transition, not entrance choreography — it
  stays even with reduced motion (it's a hover affordance, not an
  entrance).
- **CopyCommand copy-flash.** When the CopyCommand chip is clicked and
  copy succeeds, flash the chip's border mint for 150ms, then return to
  default. This is micro-interaction feedback, not entrance motion.
- **Eyebrow decision: remove both.** Per the impeccable skill's ban on
  "tiny uppercase tracked eyebrow above every section" and the visual
  review's finding that 2-of-4 sections having eyebrows reads template,
  remove the two existing eyebrows ("THE ANSWER IN 2 SECONDS",
  "CRYPTOGRAPHY WITHOUT CEREMONY"). Replace with section headings that
  stand on their own (the existing H2s are already strong). If the
  eyebrow copy is load-bearing, fold it into the H2 or the section's
  first paragraph. This is the simpler of the two eyebrow options
  (always-on vs always-off) and matches DESIGN.md's restraint.

### Should Have

- **Sticky sub-nav anchor bar.** A thin sticky bar below the topnav
  (desktop only) with anchor links: `Receipt · Questions · Channels ·
  Pricing`. Appears after scrolling past the hero. Helps with the
  "scroll of death" finding on mobile (though mobile likely omits this —
  it's a desktop enhancement). Defer if it adds complexity without clear
  value.
- **Section rhythm pass.** After the grid break and motion are in place,
  audit vertical spacing between sections. Vary it — not every section
  should have `py-16 md:py-20`. The impeccable skill: "Vary spacing for
  rhythm." Tighter after proof sections, looser around the closing CTA.

### Won't Do

- No new components beyond what's needed for motion (a `Reveal` wrapper
  or equivalent if one doesn't exist in the codebase).
- No changes to the hero structure (0018 owns that).
- No changes to trust signals (0019 owns those).
- No copy changes (0017 owns those) — except folding eyebrow copy into
  headings if needed for the eyebrow removal.
- No new routes, no API changes, no new types.
- No parallax, no scroll-jacking, no custom cursor. Standard fade-ups
  only.
- No motion on the dashboard (product register). Motion is
  marketing-register only.

## API / Data Contracts

None. All changes are visual/interaction. No API, mock, or type changes.

## UI/UX Notes

- **Motion library:** check `package.json` for `motion`, `framer-motion`,
  or `motion/react`. If none is installed, install `motion` (the
  current recommended package per the impeccable skill) — research the
  current version and API before installing, per AGENTS.md
  `ledgerful.edit[4]` ("research current documentation and pins online
  before adding or upgrading outside dependencies"). If installation is
  blocked or undesired, implement with `IntersectionObserver` + CSS
  transitions (no library). Both are acceptable; the library is simpler,
  the IntersectionObserver approach is zero-dependency.
- **Easing:** per impeccable skill, exponential ease-out only
  (`cubic-bezier(0.16, 1, 0.3, 1)` for ease-out-expo, or
  `cubic-bezier(0.22, 1, 0.36, 1)` for ease-out-quart). No bounce, no
  elastic, no `ease-in`.
- **Reduced motion:** the existing `@media (prefers-reduced-motion:
  reduce)` block in `globals.css` sets `animation-duration: 0.01ms` and
  `transition-duration: 0.01ms` on all elements. This handles CSS-based
  motion. For JS-based motion (Framer Motion / Motion), use the
  library's `useReducedMotion` hook (or equivalent) to skip the
  animation entirely — do not rely on the CSS override for JS-driven
  transforms.
- **Eyebrow removal:** removing the two eyebrows is a copy-adjacent
  edit. If the eyebrow copy ("The answer in 2 seconds", "Cryptography
  without ceremony") is load-bearing, fold it into the H2. Example:
  `Risk you can screenshot and trust.` stays as H2; "The answer in 2
  seconds" becomes the first sentence of the section body, or is
  dropped if the H2 already carries the meaning.
- **Card hover lift:** `hover:-translate-y-0.5 transition-transform
  duration-100 ease-out` (Tailwind). Verify this doesn't cause layout
  shift in adjacent elements (translateY doesn't affect layout, so it
  should be safe).

## Testing Strategy

- `npm run build` — must pass.
- `npm run lint` — must pass.
- `npm run test:unit` — if any motion component has a test (likely not,
  but check).
- Manual: scroll the landing page on desktop (1440x900) and mobile
  (390x844). Verify:
  - No two identical 3-card grids in a row.
  - Emerald `impacts` span in H1 stays on one line at 320, 375, 390,
    414px.
  - Fade-up reveals fire once on scroll-down, do not re-fire on
    scroll-back.
  - With `prefers-reduced-motion: reduce` (DevTools > Rendering), all
    motion is skipped, content is immediately visible.
  - Card hover lifts 1-2px, no scale, no shadow change.
  - CopyCommand chip flashes mint on copy.
  - No eyebrows above sections.
- ui-specialist screenshots at desktop and mobile →
  `C:\dev\output\ledgerful-0020-{desktop,mobile}.png`. Capture both
  default and reduced-motion modes.
- `codex review --uncommitted` → `C:\dev\output\review-0020.md`.

## Definition of Done

- [ ] No two identical 3-card grids appear back-to-back on the landing
      page.
- [ ] Emerald H1 span does not break mid-phrase at 320, 375, 390, 414px.
- [ ] Scroll-triggered fade-up reveals on content sections (200-300ms,
      ease-out-quart/expo, 8-12px translateY, once: true).
- [ ] `prefers-reduced-motion: reduce` skips all motion; content visible
      by default.
- [ ] Card hover lift (1-2px translateY, 100ms ease-out) on remaining
      cards.
- [ ] CopyCommand chip flashes mint on copy success (150ms).
- [ ] Both eyebrows removed; section headings stand on their own.
- [ ] No parallax, scroll-jacking, or custom cursor.
- [ ] No motion on dashboard (product-register) surfaces.
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end scroll test on desktop and mobile, default and
      reduced-motion.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] ui-specialist screenshots captured to `C:\dev\output\` (default +
      reduced-motion).
- [ ] `changeguard ledger status --compact` clean (or drift reconciled).

## Related Documents

- `docs/product.md` — register split (from 0017).
- `docs/design.md` — motion guidance, register split (from 0017).
- `conductor/0018-HeroProofLayer/spec.md` — dependency (hero structure
  must be stable before motion targets).
- `conductor/0019-TrustAndSocialProof/spec.md` — dependency (logo strip
  is part of section rhythm).
- `C:\dev\output\visual-review.md` — ui-specialist findings this addresses.
- `.agents/skills/impeccable/SKILL.md` — motion rules, absolute bans
  (eyebrows, identical card grids).
- `AGENTS.md`.
- `.agents/skills/onboarding/SKILL.md`.