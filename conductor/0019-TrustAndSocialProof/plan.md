# Track PLAN: 0019-TrustAndSocialProof — Trust Signals + Social Proof

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Read `AGENTS.md`, `docs/product.md`, `docs/design.md`.
- [ ] Read `conductor/0018-HeroProofLayer/spec.md` — confirm hero
      restructure is landed before this track (logo strip sits under the
      new hero).
- [ ] Confirm with user: canonical GitHub repo URL for the open-source
      link.
- [ ] Confirm with user: actual license (MIT / Apache 2.0 / proprietary).
- [ ] Confirm with user: SOC2 status — `SOC2 Type II` (audited) or
      `SOC2-ready` (in progress). Do not fabricate.
- [ ] Confirm with user: status page URL (or decision to omit the uptime
      link if none exists).
- [ ] Read `C:\dev\output\visual-review.md` for the trust-signal findings.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.

## Phase 2: Design / Spec

- [ ] Confirm logo strip copy: `In conversations with`.
- [ ] Confirm placeholder slot count: 4-6.
- [ ] Confirm SOC2 chip label (per user confirmation).
- [ ] Confirm trust row copy: `No telemetry · No data egress · <license>`.
- [ ] Confirm open-source line copy: `Open source. Star us on GitHub.`
- [ ] Decide: GitHub stars counter (Should Have) — implement if repo is
      public and API is reachable; otherwise defer and flag.

## Phase 3: Implementation

- [ ] Step 1: Create a `LogoStrip` component (or inline section in
      `page.tsx`) — `In conversations with` label + 4-6 placeholder
      slots. Place directly under the hero, above the SignedReceipt
      section.
- [ ] Step 2: Add SOC2 chip next to the existing "SOC2 export" pill in
      the SignedReceipt section. Use `ShieldCheck` icon (mint) + label
      per user confirmation.
- [ ] Step 3: Add open-source line under the closing CTA. Link
      `GitHub` to the confirmed repo URL.
- [ ] Step 4: Add `Uptime` link to `MarketingLayout` footer. Link to
      confirmed status URL (or placeholder flagged for follow-up).
- [ ] Step 5: Add trust row under hero CTAs: `No telemetry · No data
      egress · <license>`. Consolidate with the existing "Runs entirely
      on your machine" line — do not duplicate.
- [ ] Step 6: (If implementing) Add `<GitHubStars />` component —
      client-side fetch to public GitHub API, try/catch with no-render
      fallback. Place next to the open-source line.
- [ ] Step 7: Accessibility pass — aria labels on logo strip, accessible
      text on compliance chips, aria-hidden on decorative placeholders.

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] Manual: logo strip renders under hero on desktop and mobile.
- [ ] Manual: SOC2 chip appears next to SOC2 export pill.
- [ ] Manual: open-source line appears under closing CTA.
- [ ] Manual: uptime link appears in footer.
- [ ] Manual: trust row under hero CTAs present, no duplication with
      "no egress" line.
- [ ] Manual: no fabricated logos, star counts, uptime numbers, or
      auditor names.
- [ ] Manual contrast check on all new text.
- [ ] ui-specialist screenshots at 1440x900 and 390x844 →
      `C:\dev\output\ledgerful-0019-{desktop,mobile}.png`.
- [ ] `codex review --uncommitted --title "0019 trust and social proof"` →
      `C:\dev\output\review-0019.md`
- [ ] Subagent addresses codex findings.
- [ ] Subagent verifies fixes.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] `changeguard verify` — skipped, no backend contract changed.

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.