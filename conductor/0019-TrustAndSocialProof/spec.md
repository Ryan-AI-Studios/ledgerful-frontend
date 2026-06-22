# Track SPEC: 0019-TrustAndSocialProof — Trust Signals + Social Proof

## Objective

Add the trust-signal layer the 2026 devtool-SaaS benchmarks (Sourcegraph,
Snyk, Vercel, Semgrep) all carry and the ui-specialist review found entirely
absent on the current site: a logo strip, a SOC2 compliance mark, an
open-source line, and an uptime link. This implements the "friction removal"
half of the winning pattern (clarity, proof, friction removal) — trust
signals reduce the friction of a first-time visitor deciding whether to
install.

Depends on: **0018-HeroProofLayer** (the logo strip sits under the hero;
it should not land before the hero is restructured or it will sit under the
empty-black hero).

## Why This Matters

The ui-specialist review (`C:\dev\output\visual-review.md`) flagged "zero
trust signals" as a high-severity page-level finding:

- No customer logos.
- No GitHub stars counter or open-source link.
- No SOC2 / ISO 27001 compliance badge.
- No uptime link.
- No docs link in the hero trust row.

PRODUCT.md's adoption triangle is dev-pulls-in → manager-approves →
CISO-pays. The CISO persona needs to see a compliance mark before taking the
site seriously. The developer champion needs to see GitHub stars or an
open-source line before installing. The engineering manager needs to see
logos of recognizable teams before screenshotting the dashboard into Slack.
All three personas hit the landing page before any of them hit the dashboard;
right now the landing page gives none of them a trust anchor.

## Requirements

### Must Have

- **"In conversations with" logo strip under the hero.** A horizontal
  strip directly below the hero section (above the SignedReceipt section
  that 0018 promoted to position 2). Label: `In conversations with` in
  `label` typography (uppercase, tracked, `text-muted`). Below the label,
  a row of 4-6 placeholder logo slots. Each slot is a neutral
  `surfaceAlt` card with `border` and a subtle wordmark placeholder
  (e.g., a muted `Company` text in Inter 500, or a generic geometric
  mark). Slots are clearly placeholders — no fake company names, no
  real logos without permission. Layout: `flex flex-wrap gap-8 items-center`
  on desktop; scrollable or 2x3 grid on mobile. Mark each slot with a
  small muted `placeholder` tag in the corner if needed to make the
  placeholder status unambiguous.
- **SOC2 badge next to the SOC2 export claim.** In the SignedReceipt
  section (promoted by 0018), the existing "SOC2 export" pill currently
  reads as a claim with no mark. Add a small compliance badge next to
  it — a `surfaceAlt` rounded chip with a `ShieldCheck` icon (mint) and
  text `SOC2 Type II` or `SOC2-ready` (pick the honest version; if not
  yet audited, use `SOC2-ready` — do not claim a certification that
  doesn't exist). If ISO 27001 is also targeted, add a second chip.
  Do not fabricate auditor names (no Drata/Vanta logo unless actually
  using them).
- **Open-source line under the closing CTA.** Below the closing CTA
  buttons (which 0018 may have restructured), add a muted line:
  `Open source. Star us on GitHub.` with `GitHub` as a link to the
  repo URL (confirm the canonical repo URL with the user before linking;
  if unknown, use a placeholder href and flag it for follow-up). Style:
  `text-muted text-xs` with the link in `text-secondary` hover
  `text-primary`.
- **Uptime link in the footer.** Add an `Uptime` link to the
  MarketingLayout footer nav, linking to a status page URL. If no status
  page exists yet, link to `https://status.ledgerful.dev` as a
  placeholder and flag it; do not fabricate an uptime percentage on the
  landing page itself (that's the Better Stack pattern but only if the
  number is real).
- **Docs link in the hero trust row (or directly under CTAs).** The
  "Read the docs" ghost CTA from 0018 covers the docs path, but a small
  muted trust row directly under the CTAs can carry the micro-signals:
  `No telemetry · No data egress · MIT-licensed core` (confirm license
  with user; if not MIT, use the actual license). This row is `text-muted
  text-xs` and uses middle-dot separators. It replaces or augments the
  current "Runs entirely on your machine. No SaaS, no telemetry, no data
  egress." line — consolidate, do not duplicate.

### Should Have

- **GitHub stars counter.** If the repo is public and has a stars API,
  a small `<GitHubStars />` component showing the star count next to the
  open-source line. If the repo is private or the API is not set up,
  skip this — a fake counter is worse than no counter. Flag for
  follow-up if skipped.
- **Compliance section on the pricing page.** A small block under the
  Enterprise tier reiterating SOC2-ready, Ed25519 signatures, audit
  trail export. The CISO persona lands on pricing before buying; the
  compliance block closes that loop.

### Won't Do

- No fake customer logos. Placeholders only.
- No fake star counts, fake uptime percentages, or fake auditor names.
- No new routes (no `/customers` page, no `/trust` page). Trust signals
  live on the existing landing and pricing pages.
- No backend changes. No API calls for star counts unless the API is
  already public and the call is client-side fetch with a graceful
  fallback.
- No changes to the dashboard's product register. Trust signals are
  marketing-register only.

## API / Data Contracts

None for v1. All trust signals are static. If a GitHub stars counter is
added (Should Have), it is a client-side fetch to the public GitHub API
with a try/catch fallback to no-render on failure — no backend endpoint,
no new type, no mock.

## UI/UX Notes

- **Design tokens:** all from `globals.css` / DESIGN.md. Logo strip
  cards use `surfaceAlt` + `border`. Compliance chips use `surfaceAlt`
  + `border` + mint `ShieldCheck` icon. Trust row is `text-muted text-xs`.
- **Layout:** logo strip is a full-width section with `max-w-[1080px]
  mx-auto px-4 md:px-6 py-8` — shorter vertical padding than content
  sections so it reads as a trust band, not a feature section.
- **Placeholder honesty:** every placeholder must be visibly a
  placeholder. The "In conversations with" label does this work at the
  row level; individual slots can be plain muted wordmark shapes. Do
  not invent company names.
- **Accessibility:** logo strip is decorative if the logos are
  placeholders; use `aria-label="In conversations with design partner
  companies"` on the row and `aria-hidden="true"` on individual
  placeholder marks. Compliance chips must have accessible text (not
  icon-only).
- **Reduced motion:** no motion on trust signals. They are static.

## Testing Strategy

- `npm run build` — must pass.
- `npm run lint` — must pass.
- Manual: logo strip renders under hero on desktop and mobile;
  compliance chips appear next to SOC2 export pill; open-source line
  appears under closing CTA; uptime link appears in footer; trust row
  under hero CTAs is present and not duplicated with the "no egress"
  line.
- Manual: no fabricated logos, star counts, uptime numbers, or auditor
  names. Confirm with user before merging if any placeholder looks like
  it could be mistaken for a real endorsement.
- Manual contrast check on all new text.
- ui-specialist screenshots at desktop and mobile →
  `C:\dev\output\ledgerful-0019-{desktop,mobile}.png`.
- `codex review --uncommitted` → `C:\dev\output\review-0019.md`.

## Definition of Done

- [ ] "In conversations with" logo strip with 4-6 placeholder slots
      rendered under the hero.
- [ ] SOC2 chip next to the SOC2 export claim in the SignedReceipt
      section (honest label: `SOC2 Type II` or `SOC2-ready`).
- [ ] Open-source line under the closing CTA with a GitHub link.
- [ ] Uptime link in the footer.
- [ ] Trust row under hero CTAs (`No telemetry · No data egress ·
      <license>`) consolidating the existing "no egress" line.
- [ ] No fabricated logos, star counts, uptime numbers, or auditor
      names.
- [ ] All new text passes WCAG 2.2 AA contrast.
- [ ] Logo strip is accessible (aria labels on row, aria-hidden on
      decorative placeholders).
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end test passed.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] ui-specialist screenshots captured to `C:\dev\output\`.
- [ ] `changeguard ledger status --compact` clean (or drift reconciled).

## Related Documents

- `docs/product.md` — adoption triangle (dev → manager → CISO).
- `docs/design.md` — tokens, register split (from 0017).
- `conductor/0018-HeroProofLayer/spec.md` — dependency (logo strip sits
  under the restructured hero).
- `C:\dev\output\visual-review.md` — ui-specialist findings this addresses.
- `AGENTS.md`.
- `.agents/skills/onboarding/SKILL.md`.