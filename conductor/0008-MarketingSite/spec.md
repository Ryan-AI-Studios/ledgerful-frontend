# Track SPEC: 0008-MarketingSite — Landing, Pricing, and Docs Shell

## Objective

Add a public marketing site within the Next.js app (or as a separate build target) that includes a landing page, pricing table, and a docs shell. This gives ChangeGuard/Ledgerful a web presence for inbound traffic and enterprise credibility.

## Why This Matters

The monetization roadmap ranks landing page + pricing + docs site as priority #5 and states "zero web presence = zero credibility for enterprise buyers." Before anyone pays, they Google the product. A professional web presence converts MCP/GitHub App interest into trials and sales conversations.

## Requirements

### Must Have
- Landing page at the root or `/` marketing route with:
  - Hero: "Local-first change intelligence. Cryptographic provenance. AI governance ready."
  - Install command / GitHub App install button.
  - Key value props (cryptographic ledger, knowledge graph, AI provenance, local-first).
- Pricing page at `/pricing` with Free/Pro/Enterprise tiers aligned to the roadmap.
- Docs shell at `/docs` with at least an index and a quick-start page.
- Uses the same design system (`docs/design.md`) as the dashboard.
- Responsive layout from desktop to mobile.

### Should Have
- Interactive demo / screenshot carousel.
- Changelog / blog index.
- "Request demo" or contact form for Enterprise.

### Won't Do
- Full documentation migration from the backend repo (deferred).
- Billing or checkout flow in this track.

## Implementation Options

Two valid approaches:

1. **Same Next.js app, route group** — create `src/app/(marketing)/` with `layout.tsx` that hides the dashboard sidebar. Fastest to ship; shares design tokens and build pipeline.
2. **Separate repo/project** — cleaner separation but adds deployment complexity.

Recommended: start with option 1. If marketing pages grow large or need a separate CMS, split them later.

## UI/UX Notes

- Public pages can use lighter density than the dashboard but must keep the dark-first, mint-accent identity.
- No emoji; use icons or simple SVG illustrations.
- Pricing table highlights Pro tier as recommended.

## Testing Strategy

- Manual responsive testing.
- Lighthouse check for accessibility and performance.
- Screenshot of landing, pricing, and docs pages.

## Definition of Done

- [ ] Landing page exists and is reachable.
- [ ] Pricing page shows Free/Pro/Enterprise tiers.
- [ ] Docs shell has an index and quick-start page.
- [ ] Marketing routes do not show dashboard sidebar.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Screenshots captured.
- [ ] `changeguard ledger status --compact` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
