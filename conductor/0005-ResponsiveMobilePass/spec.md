# Track SPEC: 0005-ResponsiveMobilePass — Responsive Layout and Mobile Pass

## Objective

Make the Ledgerful dashboard usable across viewport sizes from 1280px desktop down to 375px mobile by adding a responsive sidebar, collapsible navigation, and touch-friendly tables.

## Why This Matters

Managers screenshot the dashboard on laptops and tablets. Developers may check status on phones. v1 hardcodes a 260px sidebar and dense tables that break below ~1100px. A responsive pass makes the product credible in more contexts.

## Requirements

### Must Have
- Collapsible sidebar on viewports below `1024px` (hamburger trigger in TopNav).
- Main content grid adapts from 3 columns to 2 to 1 as viewport narrows.
- Tables on `/changes`, `/ledger`, `/hotspots` become horizontally scrollable cards below `768px`.
- Touch targets minimum `44×44px` for all interactive elements.
- No horizontal overflow at `375px` width.

### Should Have
- Sticky TopNav on scroll.
- Sidebar overlay with scrim on mobile instead of persistent column.
- Simplified metric cards on small screens.

### Won't Do
- Native mobile app.
- Offline-first PWA service worker.

## UI/UX Notes

- Preserve dark-first, dense design language; do not sacrifice information density on desktop.
- Use Tailwind responsive prefixes (`md:`, `lg:`, `xl:`) consistently.
- Focus management: when sidebar opens as overlay, trap focus inside; close with Esc.
- Respect `prefers-reduced-motion` for sidebar transitions.

## Testing Strategy

- Manual testing at 375px, 768px, 1024px, 1440px using DevTools.
- Screenshot script updates for key breakpoints.
- `npm run build` and `npm run lint` as baseline.

## Definition of Done

- [ ] Dashboard is usable without horizontal scroll from 375px to 1440px.
- [ ] Mobile sidebar opens/closes correctly with focus trap.
- [ ] All tables remain readable on small screens.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Responsive screenshots captured.
- [ ] `changeguard ledger status` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
