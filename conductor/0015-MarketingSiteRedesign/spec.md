# Track SPEC: 0015-MarketingSiteRedesign — Brand-Voice Marketing Site

## Objective

Redesign the public marketing surfaces (landing, pricing, docs) from generic
AI-SaaS-slop into a credible, brand-voice site that matches the committed
DESIGN.md system and the monetization roadmap's positioning. This is a
ground-up rebuild of Track 0008's output, not a patch.

## Why This Matters

The monetization roadmap (Priority #5) states "zero web presence = zero
credibility for enterprise buyers." Track 0008 shipped a site, but it
violates the project's own DESIGN.md on multiple fronts (rounded-2xl cards,
scale-105 hovers, decorative shadow-xl, icon-in-circle 3-card grids) and
reads as the exact AI-SaaS-slop PRODUCT.md lists as an anti-reference. A
staff engineer or CISO landing on the current site would not trust the
product. This track replaces it with a committed-dark, single-mint,
terminal-as-evidence site that matches the dashboard's credibility.

## Requirements

### Must Have

- **Landing page (`/`):** Hero with the spec-mandated 3-line headline (middle
  line in mint accent), one-line subhead, and the install command as the
  primary CTA with click-to-copy. A "terminal receipt" panel showing a
  realistic `ledgerful scan` output with multi-cue risk badges (the product
  demo, rendered in JetBrains Mono — not a screenshot). A "three questions
  git can't answer" section (statements, not icon cards). A "cryptography
  without ceremony" section showing a sample signed transaction receipt. A
  distribution-channels sequence (MCP server / GitHub App / local dashboard).
  Closing CTA to pricing.
- **Pricing page (`/pricing`):** Three tiers in a dense table layout —
  Free ($0), Pro ($19/mo or $190/yr, highlighted with mint border, 5 seats,
  GitHub App, team dashboard, Slack webhooks, merge blocking), Enterprise
  ($99/mo/seat or $5k/yr, SSO/SAML, SOC2 export, RBAC, audit trails, SLA).
  Comparison matrix below the tiers. Enterprise CTA is "Request demo."
  Short FAQ for common objections.
- **Docs shell (`/docs`):** Sticky left-rail nav with search input, content
  area with quick-start guide (install → init → start → scan --open). Real
  CLI commands in JetBrains Mono code blocks. Section anchors with
  scroll-mt. No numbered-circle steps.
- **Shared `MarketingLayout` + `MarketingTopNav` + footer:** Rebuilt to
  DESIGN.md spec. TopNav with mint active underline, "Dashboard" secondary
  link, "Get Started" primary CTA. Footer with brand, tagline, nav, copyright.
  No social icons.
- **Design system conformance:** Cards max `rounded-lg` (8px); modals/popovers
  max `rounded-xl` (12px); buttons/inputs `rounded-md` (6px). No
  `rounded-2xl`. No `scale-105`. No decorative `shadow-xl`. No icon-in-circle
  3-card grids. No gradient text. No glassmorphism. No emoji. Mint accent
  only for action/active; coral only for AI-attribution. Risk colors only
  for risk.
- **Responsive:** Desktop → tablet → mobile. TopNav collapses; hero stacks;
  pricing table becomes stacked list; docs sidebar moves above content.
- **Accessibility:** WCAG 2.2 AA. Skip link at top of every page. 2px
  borderStrong focus rings at 2px offset. Multi-cue risk (color + icon +
  text). `prefers-reduced-motion` respected. Keyboard-navigable.

### Should Have

- Copy-to-clipboard with three-state feedback (Copy / Copied + mint check /
  fallback).
- `text-wrap: balance` on h1–h3; `text-wrap: pretty` on long prose.
- Dense, scannable pricing comparison matrix.

### Won't Do

- Blog, changelog, or full documentation migration from the backend repo.
- Billing or checkout flow.
- Real search functionality in docs (input is a visual placeholder for v1).
- SSO/SAML UI (backend doesn't support it; Frontend-Notes.md §5).
- Telemetry or analytics integration.
- New font families or palette changes (identity preservation wins).
- Image-heavy hero (this is a dev tool; the terminal receipt IS the imagery).

## API / Data Contracts

No new API contracts. All marketing content is static. Pricing tiers are
hardcoded from the monetization roadmap. The "terminal receipt" and "signed
transaction" panels are static JSX rendered in JetBrains Mono — they are
visual evidence of the product, not live data.

## UI/UX Notes

- **Design tokens:** All from `globals.css` / DESIGN.md. No new tokens.
- **Color strategy:** Committed — GitHub-dark surface, single mint accent,
  no gradients.
- **Typography:** Inter Variable for UI, JetBrains Mono for data/commands.
  Body 14px. Display 36px / 600 / -0.022em.
- **Density:** Information-rich. The landing page is a single long scroll
  with deliberate rhythm, not a spaced-out SaaS template.
- **Motion:** 100–200ms ease-out for state transitions only. No entrance
  choreography. No hover scale. Reduced motion collapses to instant.
- **Imagery:** Zero photographic imagery. The "terminal receipt" and
  "signed transaction" panels are the visual evidence — rendered in code,
  not screenshots. The existing `public/dashboard.png` may be used as a
  secondary visual but is not the hero.

## Testing Strategy

- `npm run build` — must pass.
- `npm run lint` — must pass.
- Manual responsive testing: mobile (375px), tablet (768px), desktop (1280px).
- Manual keyboard nav: tab through nav, copy button, anchor links.
- Manual focus-ring visibility check.
- Manual contrast check on all text against surfaces.
- Screenshots of landing, pricing, docs at desktop + mobile.

## Definition of Done

- [x] No placeholders or stubs remain.
- [x] Landing page rebuilt with hero, terminal receipt, three-questions,
      signed receipt, distribution channels, closing CTA.
- [x] Pricing page rebuilt with roadmap tiers ($19/$99), comparison matrix,
      FAQ, "Request demo" CTA.
- [x] Docs shell rebuilt with sticky left rail, quick-start, real commands.
- [x] MarketingLayout, MarketingTopNav, footer rebuilt to DESIGN.md.
- [x] Copy-to-clipboard on install command with 3-state feedback.
- [x] No rounded-2xl, no scale-105, no shadow-xl decoration, no icon-circle
      grids, no gradient text, no glassmorphism, no emoji.
- [x] Mint accent only for action/active; coral only for AI-attribution.
- [x] Skip link on every page.
- [x] Responsive: mobile, tablet, desktop verified.
- [x] Keyboard nav and focus rings verified.
- [x] Implementation reviewed by a subagent.
- [x] Review findings addressed and verified by a subagent.
- [x] `codex review` run on uncommitted diff; findings addressed.
- [x] Second `codex review` confirms no new critical/high findings.
- [x] Manual end-to-end test of landing, pricing, docs passed.
- [x] `npm run build` passes.
- [x] `npm run lint` passes.
- [x] Screenshots captured.
- [x] `changeguard ledger status --compact` clean (or drift reconciled).

## Related Documents

- `docs/product.md` — personas, brand personality, anti-references.
- `docs/design.md` — canonical token set and component rules.
- `C:\Users\RyanB\Desktop\changeguard_monetization_roadmap.md` — pricing
  tiers, distribution channels, priority ordering.
- `C:\dev\ChangeGuard\docs\Frontend-Notes.md` — backend constraints (no
  SSO/RBAC in local daemon; telemetry endpoint).
- `conductor/0008-MarketingSite/spec.md` — original track (superseded).
- `AGENTS.md`.
- `.agents/skills/onboarding/SKILL.md`.