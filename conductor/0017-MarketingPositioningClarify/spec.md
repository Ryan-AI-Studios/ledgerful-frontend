# Track SPEC: 0017-MarketingPositioningClarify — Positioning + Register Split

## Objective

Lock the marketing positioning (category, niche, hero H1, taglines) and add an
explicit marketing-vs-product register split to `docs/design.md`. This unblocks
every later marketing track by resolving the tension between DESIGN.md's "the
web UI is not a marketing site" and the pre-auth landing surface's need to
behave like a devtool SaaS marketing page.

## Why This Matters

Two issues make the current site under-perform against 2026 devtool-SaaS
benchmarks (Sourcegraph, Graphite, CodeRabbit, Linear):

1. **Register conflict.** DESIGN.md says "the web UI is not a marketing
   site — it's a power tool." That rule is correct for the authenticated
   dashboard, but it has frozen the pre-auth landing page into product-surface
   restraint: no filled primary CTA, no scroll motion, no marketing-grade hero
   rhythm. The marketing register is never given permission to be a marketing
   surface. Result: competent but flat.
2. **Drift between positioning docs.** PRODUCT.md names "the intent ledger
   for agentic engineering" and "the ledger AI agents can't silently skip."
   The current hero reads as three slogans ("Local-first change intelligence /
   Cryptographic provenance / AI governance ready") and the closing CTA copy
   ("Join high-integrity teams building the next generation of software with
   Ledgerful") reads as the vague AI copy the feedback doc explicitly warns
   against ("Revolutionizing software development with AI").

The 2026 devtool-SaaS winning pattern is **clarity, proof, friction removal**.
This track delivers the clarity half and the register split that lets proof +
friction-removal land in 0018-0020.

## Requirements

### Must Have

- **Register split in DESIGN.md.** Add an explicit section (under "Overview"
  or a new "## Registers" block) stating:
  - Pre-auth surfaces (`/`, `/pricing`, `/docs`, any future `/blog`, `/changelog`)
    follow the **marketing register**: filled primary CTAs, scroll motion,
    product visuals, logo strips, compliance badges, single-slogan H1.
  - Authenticated app surfaces (`/dashboard`, `/changes`, `/ledger`, `/hotspots`,
    `/graph`, `/settings`, `/projects`, `/status`, `/verify`, `/compliance`,
    `/profile`, `/trends`) follow the **product register**: density, hairline
    borders, no filled marketing CTAs, no marketing motion, risk multi-cue.
  - Shared invariants across both: no emoji, no gradient text, no glassmorphism,
    mint accent only for action/active, coral only for AI-attribution, risk
    colors only for risk, WCAG 2.2 AA, `prefers-reduced-motion` honored.
- **Hero H1 rewrite.** Replace the current three-slogan H1
  (`Local-first change intelligence. / Cryptographic provenance. / AI
  governance ready.`) with a single promise:
  `Know what your change impacts — before review.`
  The emerald accent (`var(--color-primary)`) moves onto `impacts` — the
  load-bearing word — and the emerald span must never break mid-phrase on any
  viewport (see 0020 for the CSS fix, but the copy must permit it).
- **Hero subhead rewrite.** Replace the current subhead with one that keeps
  the agentic-engineering relevance (PRODUCT.md) in the subhead, not the
  headline. Proposed:
  `The intent ledger for agentic engineering. Map change impact, find the tests
  your PR actually needs, and catch unresolved review gaps — before humans or
  AI touch the diff. Runs local-first; no SaaS, no telemetry, no data egress.`
- **Remove all "AI-assisted" framing from marketing copy.** PRODUCT.md is
  explicit: Ledgerful is not an AI code reviewer (CodeRabbit/Qodo lane). It is
  a ledger that AI agents can read but cannot bypass. Audit `src/app/page.tsx`,
  `src/app/pricing/page.tsx`, `src/app/docs/page.tsx`, and
  `src/components/MarketingLayout.tsx` for any "AI-assisted" / "AI-powered" /
  "Revolutionizing software development with AI" style copy and replace with
  the ledger-as-source-of-truth framing:
  - "the ledger AI agents can't silently skip"
  - "signed intent records your AI agents read before touching the diff"
  - "verification plans the AI can't bypass"
- **Closing CTA rewrite.** Replace "Join high-integrity teams building the
  next generation of software with Ledgerful." with a concrete, non-vague
  statement. Proposed:
  `Install in 60 seconds. Map your first change in under five.`
- **Tagline canonicalization.** Pick one canonical tagline for the footer
  and meta description:
  `Ledgerful — the intent ledger for agentic engineering.`
  Update `src/app/layout.tsx` metadata.description and the MarketingLayout
  footer to use it verbatim. Remove alternates ("Project Health", "Local-first
  intent ledger for agentic engineering", etc.).
- **"Book a Demo" / "Request demo" decision.** Keep the existing
  `mailto:sales@ledgerful.dev` "Request demo" CTA on the Enterprise pricing
  tier only (it is a sales-motion CTA for a paid tier). Do NOT add "Book a
  Demo" anywhere on the landing hero — PRODUCT.md is PLG-first via
  `npm install -g @ledgerful/cli`. The landing CTAs are Install + Read the
  docs (self-serve), not Install + Book a Demo. (0018 implements the filled
  primary CTA; this track only locks the copy decision.)
- **Category positioning statement.** Add a one-paragraph positioning
  statement to `docs/product.md` (under a new "## Positioning" section, or
  appended to "## Product Purpose" if a section feels heavy):
  `Ledgerful is a B2B developer-tool SaaS in the DevSecOps /
  code-intelligence / AI-assisted code review lane. Primary category:
  developer tools SaaS. Secondary: code intelligence / codebase
  understanding, AI code review / PR quality. Trust overlay: DevSecOps /
  secure SDLC. Closest benchmarks: Sourcegraph (codebase credibility),
  Graphite + CodeRabbit (CTA simplicity), Linear (polish), Snyk + Semgrep
  (trust language, borrowed in form not content). Not a generic
  cybersecurity SaaS — do not position against Snyk/Wiz/CrowdStrike.`

### Should Have

- **Refine the "three questions git can't answer" framing.** The current
  framing positions git as the competitor. Consider reframing as "three
  questions your PR queue can't answer" or "three questions your AI agent
  can't answer from the diff alone" — positions the gap, not the tool.
  Defer the final rewrite to 0018 if it's load-bearing on layout.

### Won't Do

- No visual layout changes in this track (those are 0018-0020). Copy-only
  edits to the landing/pricing/docs shell are in scope; structural JSX
  changes are not.
- No new components, no new routes, no API changes.
- No font or palette changes (identity preservation per DESIGN.md).
- No removal of the existing `TerminalReceipt`, `SignedReceipt`, or
  `CopyCommand` components — they're promoted in 0018.

## API / Data Contracts

None. No API, mock, or type changes. Marketing content is static.

## UI/UX Notes

- All copy edits stay within existing token system and component structure.
- H1 must use `text-wrap: balance` (already present) and must not introduce
  a new `<br/>` between the emerald span and surrounding text — the single
  emerald span wraps `impacts` only, so it can be kept on one line at ≥390px
  via `white-space: nowrap` on that span (final CSS lands in 0020, but the
  copy here must permit it).
- Subhead length target: 2-3 lines at 1080px max-width, 65-75ch per line.
- No emoji. No new typography. No gradient text.

## Testing Strategy

- `npm run build` — must pass.
- `npm run lint` — must pass.
- Manual read-through of landing, pricing, docs at desktop (1280px) and
  mobile (390px). Confirm: H1 reads as one promise, emerald accent is on
  `impacts` only, no "AI-assisted" / "Revolutionizing" style copy remains,
  closing CTA is concrete, footer tagline is canonical.
- Grep the repo for `AI-assisted`, `AI powered`, `Revolutionizing`,
  `next generation of software` — must return zero hits in
  `src/app/` and `src/components/`.
- `changeguard ledger status --compact` clean (or drift reconciled).

## Definition of Done

- [ ] DESIGN.md has an explicit marketing-vs-product register split section.
- [ ] `docs/product.md` has the category positioning statement.
- [ ] Landing H1 is `Know what your change impacts — before review.`
- [ ] Landing subhead is the agentic-engineering paragraph above.
- [ ] Closing CTA copy is concrete (no "next generation of software").
- [ ] Footer tagline and `metadata.description` are canonical.
- [ ] Grep for `AI-assisted|AI powered|Revolutionizing|next generation of
      software` returns zero hits in `src/app/` and `src/components/`.
- [ ] "Request demo" remains only on the Enterprise pricing tier.
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end read-through passed.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] `changeguard ledger status --compact` clean (or drift reconciled).

## Related Documents

- `docs/product.md` — personas, brand personality, anti-references.
- `docs/design.md` — canonical token set; will receive register split.
- `conductor/0015-MarketingSiteRedesign/spec.md` — prior track whose output
  this refines (not reverts).
- `C:\dev\output\visual-review.md` — ui-specialist review that surfaced the
  H1 / CTA / trust gaps.
- The user-supplied benchmark/positioning feedback doc (2026 devtool-SaaS
  category classification).
- `AGENTS.md`.
- `.agents/skills/onboarding/SKILL.md`.