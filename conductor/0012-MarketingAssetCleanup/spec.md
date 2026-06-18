# Track SPEC: 0012-MarketingAssetCleanup — Remove or Properly Wire Unused Marketing Images

## Objective

Resolve `public/Banner.png` (906 KB) and `public/Icon.png` (833 KB) — two large image files with **zero references anywhere in the codebase** — either by deleting them or by properly wiring them into Next.js's metadata file convention with compression. Either outcome must keep them out of the bundle that ChangeGuard's CLI embeds into its binary.

## Why This Matters

Verified 2026-06-17 via `grep -rln "Banner\.png\|Icon\.png" --include="*.ts" --include="*.tsx" --include="*.json" --include="*.md" .` (excluding `out/`, `.next/`, `node_modules/`): **zero matches**. Neither file is referenced in `layout.tsx` metadata, any component, or any config. They are not wired into Open Graph previews, favicons, or anything else — they sit in `public/` and get copied verbatim into every `next build` static export.

This matters for two independent reasons:
1. **CLI bundle bloat**: ChangeGuard's `src/commands/web/server.rs` embeds the entire `out/` directory into the compiled CLI binary (`#[derive(rust_embed::Embed)] #[folder = "../ledgerful-frontend/out"]`, no filtering). These two files alone are ~1.74MB — about 40% of the current 4.3MB export — for content that serves zero purpose in the local dashboard. See ChangeGuard's `conductor/trackM5/spec.md` for the consuming side of this problem.
2. **Site performance**: even on the live marketing site (Vercel), serving multi-hundred-KB unoptimized PNGs hurts Lighthouse/Core Web Vitals scores — something Track `0008-MarketingSite`'s own Definition of Done explicitly checks for ("Lighthouse check for accessibility and performance").

## Requirements

### Must Have

- Determine actual intent for these two files (check with design/product before deciding — this spec can't determine intent from the code alone):
  - **If genuinely unused / leftover scaffolding**: delete both from `public/`.
  - **If intended for Open Graph preview / app icon**: re-introduce them properly via Next.js's file-based metadata convention (`src/app/opengraph-image.png`, `src/app/icon.png`) — **not** as loose `public/` files — after compressing them (target: well under 100KB each; OG images conventionally cap around 1200×630px, app icons around 512×512px — resize accordingly, don't just re-compress at original dimensions).
- Whichever path is chosen, the final state must NOT regress: confirm via `ls public/*.png` (or wherever they end up) and a fresh `npm run build` that the exported `out/` directory either excludes these files entirely or includes them only at a properly-compressed, intentional size.
- Note for `ChangeGuard` Track M5 (cross-repo coordination): once this track lands, check `ls public/*.png` from the ChangeGuard repo's side before that track adds `#[exclude = ...]` attributes — if the files are gone, M5's exclude attributes become unnecessary; if renamed/moved (e.g. to `opengraph-image.png`), M5 needs updated glob patterns.

### Should Have

- A brief audit of `public/` for any other unreferenced files while in here (the existing `file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` are Next.js's default scaffold icons — confirm whether any of these are actually used either; if not, clean those up too since they're zero-cost to remove and keep the export tidy).

### Won't Do

- No general image-optimization pipeline/build step for the whole site in this track — scoped strictly to the two confirmed-oversized, confirmed-unreferenced files (plus the trivial scaffold-icon audit). A broader "optimize all marketing images" pass is separate future work if it turns out to be needed.

## Technical Notes

- This app uses `output: "export"` (`next.config.ts`), which means Next's on-demand Image Optimization API (`/_next/image`) is **not available at runtime** — there's no server to do on-demand resizing. Per Next.js's own static-export guidance, images used via `next/image` under static export must either set `images.unoptimized = true` and be pre-sized/pre-compressed by hand, or use the file-based metadata convention (which Next pre-renders at build time regardless of export mode). Don't assume `next/image` will "just optimize it" here — it won't, under this config.

## Testing Strategy

- `npm run build`, then `ls out/*.png` (or check wherever the chosen path lands) — confirm the final exported size of these assets matches the decision made.
- Manual: if re-wired as OG image/icon, check the rendered `<head>` meta tags point at the new files and validate via a social-preview debugger (e.g. paste the deployed URL into a Twitter/Facebook card validator) — only if Should-Have path is chosen.
- `npm run build` and `npm run lint` both pass.

## Definition of Done

- [x] Decision made and documented (delete vs. properly re-wire) with a one-line rationale in the commit message.
- [x] `public/` no longer contains unreferenced multi-hundred-KB images.
- [x] If re-wired: images compressed and placed via Next's metadata file convention, confirmed in rendered `<head>`. (N/A - Deletion chosen)
- [x] Scaffold SVG icons in `public/` audited; removed if unreferenced.
- [x] `npm run build` passes.
- [x] `npm run lint` passes.
- [x] `changeguard ledger status --compact` clean.
- [x] Registry status updated to Completed.
- [x] Flagged to whoever runs ChangeGuard Track M5 that this track is done and what the final filenames/state are. (Flagged via doc update in Backend-Notes.md and commit message)

## Related Documents

- `ChangeGuard/conductor/trackM5/spec.md` — the consuming side of this same problem
- `docs/design.md`
- `AGENTS.md`
