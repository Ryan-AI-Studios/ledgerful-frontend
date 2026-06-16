# Track SPEC: 0003-UserMenu — User Menu and Session Surface

## Objective

Replace the TopNav avatar placeholder (the letter "Y") with a functional, accessible user menu that exposes session identity and common account actions.

## Why This Matters

The placeholder creates a dead-end interaction. A real menu makes the dashboard feel complete and gives users a predictable path to profile, settings, and sign-out flows.

## Requirements

### Must Have
- Clickable avatar/menu trigger in `TopNav` top-right.
- Dropdown menu with: Profile, Settings, Sign out.
- Keyboard accessible: open with Enter/Space, navigate with arrow keys, close with Esc.
- Focus trap and return focus to trigger on close.
- Click outside closes the menu.

### Should Have
- User initials derived from session name, or fallback avatar icon.
- Role/badge hint (e.g., "Admin", "Member") if available from session API.

### Won't Do
- Full authentication or session management backend (frontend-only UI for now).
- Account creation or password reset flows.

## API / Data Contracts

```ts
// src/lib/types.ts additions
export interface UserSession {
  id: string;
  name: string;
  email: string;
  role?: "admin" | "member" | "viewer";
  avatarUrl?: string;
}
```

Live endpoint:
- `GET /api/v1/session`

Mock fallback returns a single demo user.

## UI/UX Notes

- Menu uses `surfaceRaised` dropdown with shadow per `docs/design.md`.
- Avatar uses the mint primary border for focus, initials in `textPrimary` on `surfaceAlt`.
- Each menu item has hover state `surfaceRaised`, rounded `md`.
- Respect `prefers-reduced-motion`: no entrance animations that gate content.

## Testing Strategy

- Unit tests for dropdown keyboard navigation.
- Manual verification of click-outside, Esc, and focus return.
- Screenshot of open menu state.

## Definition of Done

- [ ] No placeholders or stubs remain in the implementation.
- [ ] `TopNav` user menu opens and closes correctly.
- [ ] All menu items are keyboard navigable.
- [ ] Focus returns to trigger on close.
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on the uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end test of keyboard and mouse menu interactions passed.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Screenshots updated.
- [ ] `changeguard ledger status` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
- `conductor/0001-DaemonAPIClientLayer/spec.md`
