# Track PLAN: 0012-MarketingAssetCleanup

## Phase 1: Discovery

- [x] Read `conductor/conductor.md` for context.
- [x] Run `changeguard ledger status --compact`.
- [x] Run `npm run build` to confirm baseline compiles.
- [x] Confirm zero references: `grep -rln "Banner\.png\|Icon\.png" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" .` (excluding `out/`, `.next/`, `node_modules/`) — expect empty.
- [x] Check `public/` for other possibly-unreferenced scaffold files (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`).

## Phase 2: Decision

- [x] Decide: delete `Banner.png`/`Icon.png`, or properly wire them as `opengraph-image.png`/`icon.png` with compression. If unsure of intent, default to **delete** (lowest risk, easily reversible via git history if intent surfaces later) and note this in the commit message.

## Phase 3: Implementation

- [x] If deleting: `git rm public/Banner.png public/Icon.png` (and any other confirmed-unreferenced scaffold SVGs).
- [x] If re-wiring: compress/resize source images (OG ~1200×630px, icon ~512×512px, target <100KB each), place at `src/app/opengraph-image.png` / `src/app/icon.png` per Next's metadata file convention, remove the old `public/` copies.

## Phase 4: Verification

- [x] `npm run build`
- [x] `npm run lint`
- [x] `ls out/*.png` (or wherever applicable) — confirm final state matches the decision.
- [ ] If re-wired: manually check rendered `<head>` for the new meta tags. (N/A - Deleted)

## Phase 5: Finalization

- [x] Mark this track Completed in `conductor/conductor.md`.
- [x] Commit with `changeguard ledger commit <tx-id> --summary "..." --reason "..."`.
- [x] Run `changeguard ledger status --compact` to confirm clean.
- [x] Note the final filenames/state in the commit message so ChangeGuard Track M5 can check before adding its `#[exclude = ...]` attributes.
