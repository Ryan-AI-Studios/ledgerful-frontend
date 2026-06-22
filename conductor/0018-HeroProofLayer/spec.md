# Track SPEC: 0018-HeroProofLayer — Hero Restructure + Proof Promotion

## Objective

Restructure the landing hero into a 60/40 split (copy left, TerminalReceipt
right), add a filled mint primary CTA + ghost secondary CTA, and promote the
SignedReceipt so the two strongest proof artifacts anchor the page instead of
burying it mid-scroll. This is the highest-impact visual fix from the
ui-specialist review and directly implements the "proof" half of the 2026
devtool-SaaS winning pattern (clarity, proof, friction removal).

Depends on: **0017-MarketingPositioningClarify** (H1 copy, subhead, register
split must be in place so this track has the right copy to lay out).

## Why This Matters

The ui-specialist visual review (`C:\dev\output\visual-review.md`) found:

- ~50% of the 1440px hero is empty black on the right — nothing anchors
  the eye.
- No filled primary CTA above the fold. The install chip reads as a code
  sample; "View pricing" is a thin text link, not a button.
- The `TerminalReceipt` and `SignedReceipt` — the two strongest proof
  artifacts on the page — are buried in sections 2 and 4. Every 2026
  devtool benchmark (Sourcegraph code-graph hero, CodeRabbit's review
  preview, Linear's product frame) leads with the product, not with text.

This track fixes all three. It does not add new proof artifacts — it
resequences and rescales existing ones. Per DESIGN.md's "terminal-as-evidence"
invariant, the TerminalReceipt IS the hero imagery. No screenshots, no
illustrations.

## Requirements

### Must Have

- **Hero 60/40 split at `lg`.** At the `lg` breakpoint (≥1024px), the hero
  becomes a CSS grid: `lg:grid-cols-[3fr_2fr]` (or similar ratio close to
  60/40). Left column: H1, subhead, CTAs, "no egress" muted line. Right
  column: the `TerminalReceipt` component, scaled to fill the column.
  Below `lg`, the hero stacks vertically: copy, then TerminalReceipt below
  the CTAs (not above — the install chip must stay immediately under the
  subhead for thumb-reach on mobile).
- **Filled mint primary CTA.** Add a filled primary button using the
  existing `buttonPrimary` token (mint bg, inverse text):
  - Label: `Get started`
  - Action: scroll to `#install` (the existing `CopyCommand` anchor) or
    link to `/docs#quick-start` if that's a better destination.
  - Style: `bg-[var(--color-primary)] text-[var(--color-text-inverse)]
    rounded-md px-5 py-2.5 font-semibold text-sm` plus the existing
    `buttonPrimaryHover` mint-muted on hover.
- **Ghost secondary CTA.** Add a ghost secondary button using the existing
  `buttonSecondary` token (transparent bg, border):
  - Label: `Read the docs`
  - Action: link to `/docs`.
  - Style: `border border-[var(--color-border)] text-[var(--color-text-primary)]
    rounded-md px-5 py-2.5 font-semibold text-sm` with hover bg
    `var(--color-surface-alt)`.
- **Remove the thin "View pricing" text link from the hero.** It is
  demoted to a sub-element of the install chip area or removed. Pricing is
  reachable from the topnav; it does not belong in the hero CTA row.
- **CTA row layout.** The filled primary and ghost secondary sit side by
  side on desktop (`flex-row gap-3`), stack on mobile (`flex-col gap-3`).
  The `CopyCommand` install chip sits above or below the button row —
  implementer's call, but the chip must not visually compete with the
  filled button. Recommended: buttons first, install chip below with a
  muted "or install the CLI" label.
- **Promote TerminalReceipt to hero.** Move the `<TerminalReceipt />`
  render from its current section (section 2, "The answer in 2 seconds")
  into the hero right column. Remove the now-redundant section 2 wrapper.
  Keep the "The answer in 2 seconds" eyebrow + heading copy — it moves to
  sit above the hero TerminalReceipt as a caption, OR becomes the eyebrow
  for the SignedReceipt section (implementer's call; do not delete it).
- **Promote SignedReceipt.** Move the `<SignedReceipt />` section higher
  in the page order so it follows the hero, not the "three questions"
  grid. It should be the second section, directly under the hero, at its
  current size or slightly larger (1.0x-1.1x; do not rescale aggressively).
  Keep the "Cryptography without ceremony" eyebrow + heading.
- **Reorder landing sections to:** Hero (with TerminalReceipt) →
  SignedReceipt → Three Questions → Distribution Channels → Closing CTA.
  This puts proof first, narrative second, distribution third.
- **Responsive.** Hero stacks at <lg. TerminalReceipt in the hero must
  not overflow on 390px — it may need a slightly smaller font scale or
  horizontal scroll within its own container on narrow viewports (the
  existing component already handles this; verify, do not assume).

### Should Have

- **Eyebrow above hero TerminalReceipt (desktop only).** A small mint
  `THE ANSWER IN 2 SECONDS` label above the TerminalReceipt in the hero
  right column, desktop only. Hidden on mobile to preserve density.
- **Subtle hover on TerminalReceipt container.** A 1px border-strong
  transition on hover (100ms ease-out) — not a lift, not a shadow. Just
  enough to signal interactivity if the component becomes interactive
  later.

### Won't Do

- No new components. Reuse `TerminalReceipt`, `SignedReceipt`,
  `CopyCommand` as-is. If a component needs a new prop (e.g., size scale),
  add the prop — do not fork the component.
- No screenshots, no illustrations, no browser-frame mockups. DESIGN.md's
  "terminal-as-evidence" invariant holds.
- No animation of the TerminalReceipt (no typewriter, no scan-line
  animation). That's a future-track decision; this track is layout.
- No changes to the `/pricing` or `/docs` pages. This track is landing
  only.
- No copy changes — those landed in 0017. This track is structural.

## API / Data Contracts

None. All proof artifacts are static JSX. No API, mock, or type changes.

## UI/UX Notes

- **Design tokens:** all from `globals.css` / DESIGN.md. No new tokens.
  Use `buttonPrimary`, `buttonPrimaryHover`, `buttonSecondary` for CTAs.
- **Grid:** `lg:grid-cols-[3fr_2fr]` or equivalent. Test at 1024, 1280,
  1440, 1920 — the TerminalReceipt column must not collapse below ~400px
  or the receipt becomes unreadable.
- **Spacing:** hero vertical padding stays at `pt-20 pb-16 md:pt-28
  md:pb-24` (existing). The 60/40 split applies to the inner grid, not
  the section padding.
- **Accessibility:** the filled primary CTA must hit 4.5:1 contrast
  (inverse text on mint = 12.72:1 per DESIGN.md — already passes). Focus
  ring 2px borderStrong at 2px offset. The TerminalReceipt must remain
  keyboard-navigable if it has interactive elements (it currently does
  not, but preserve the option).
- **Reduced motion:** no entrance animations in this track. Motion lands
  in 0020. Hover transitions (100ms) are state transitions, not entrance
  choreography — they stay.

## Testing Strategy

- `npm run build` — must pass.
- `npm run lint` — must pass.
- Manual responsive: 390px (mobile), 768px (tablet), 1024px (lg
  breakpoint), 1280px, 1440px, 1920px. Verify hero stacks correctly,
  TerminalReceipt is readable at all sizes, no horizontal overflow.
- Manual keyboard nav: tab through hero CTAs, verify focus order
  (H1 → primary CTA → secondary CTA → install chip → TerminalReceipt).
- Manual contrast check on filled button (mint on inverse text).
- ui-specialist screenshots at desktop (1440x900) and mobile (390x844)
  saved to `C:\dev\output\ledgerful-0018-{desktop,mobile}.png`.
- `codex review --uncommitted` captured to `C:\dev\output\review-0018.md`.

## Definition of Done

- [ ] Hero is a 60/40 grid at `lg`; stacks vertically below `lg`.
- [ ] Filled mint `Get started` primary CTA present above the fold.
- [ ] Ghost `Read the docs` secondary CTA present.
- [ ] "View pricing" text link removed from hero.
- [ ] `TerminalReceipt` renders in the hero right column at `lg`.
- [ ] `SignedReceipt` section is the second section, directly under hero.
- [ ] Landing section order: Hero → SignedReceipt → Three Questions →
      Distribution Channels → Closing CTA.
- [ ] No horizontal overflow at 390px, 768px, 1024px, 1280px, 1440px.
- [ ] Filled CTA contrast ≥4.5:1 (inverse on mint = 12.72:1).
- [ ] Focus rings visible on all CTAs.
- [ ] No new components created; existing ones reused (props added if
      needed).
- [ ] No screenshots or illustrations added.
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end responsive test passed.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] ui-specialist screenshots captured to `C:\dev\output\`.
- [ ] `changeguard ledger status --compact` clean (or drift reconciled).

## Related Documents

- `docs/product.md` — register split (from 0017).
- `docs/design.md` — tokens, register split (from 0017).
- `conductor/0017-MarketingPositioningClarify/spec.md` — dependency.
- `C:\dev\output\visual-review.md` — ui-specialist findings this addresses.
- `AGENTS.md`.
- `.agents/skills/onboarding/SKILL.md`.