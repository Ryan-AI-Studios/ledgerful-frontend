# Track PLAN: 0012-MarketingAssetCleanup

## Phase 1: Discovery

- [ ] Read `conductor/conductor.md` for context.
- [ ] Run `changeguard ledger status --compact`.
- [ ] Run `npm run build` to confirm baseline compiles.
- [ ] Confirm zero references: `grep -rln "Banner\.png\|Icon\.png" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" .` (excluding `out/`, `.next/`, `node_modules/`) — expect empty.
- [ ] Check `public/` for other possibly-unreferenced scaffold files (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).

## Phase 2: Decision

- [ ] Decide: delete `Banner.png`/`Icon.png`, or properly wire them as `opengraph-image.png`/`icon.png` with compression. If unsure of intent, default to **delete** (lowest risk, easily reversible via git history if intent surfaces later) and note this in the commit message.

## Phase 3: Implementation

- [ ] If deleting: `git rm public/Banner.png public/Icon.png` (and any other confirmed-unreferenced scaffold SVGs).
- [ ] If re-wiring: compress/resize source images (OG ~1200×630px, icon ~512×512px, target <100KB each), place at `src/app/opengraph-image.png` / `src/app/icon.png` per Next's metadata file convention, remove the old `public/` copies.

## Phase 4: Verification

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `ls out/*.png` (or wherever applicable) — confirm final state matches the decision.
- [ ] If re-wired: manually check rendered `<head>` for the new meta tags.

## Phase 5: Finalization

- [ ] Mark this track Completed in `conductor/conductor.md`.
- [ ] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [ ] Run `changeguard ledger status --compact` to confirm clean.
- [ ] Note the final filenames/state in the commit message so ChangeGuard Track M5 can check before adding its `#[exclude = ...]` attributes.
