# Track SPEC: {TRACK_ID} — {TITLE}

## Objective

One-sentence goal of the track.

## Why This Matters

What problem this solves and what happens if we skip it.

## Requirements

### Must Have
- Requirement 1
- Requirement 2
- Requirement 3

### Should Have
- Nice-to-have 1
- Nice-to-have 2

### Won't Do
- Out-of-scope item 1
- Out-of-scope item 2

## API / Data Contracts

Document any new types, endpoints, props, or backend contracts this track introduces or depends on.

```ts
// Example contract
export interface ExamplePayload {
  id: string;
  status: "ok" | "warning" | "error";
}
```

## UI/UX Notes

- Design tokens to use.
- Responsive behavior.
- Accessibility considerations.

## Testing Strategy

- Unit/component tests: `npm run test:unit`
- E2E/Playwright tests: `npm run test:e2e`
- Manual verification steps.
- Screenshot updates required?

## Definition of Done

- [ ] All must-have requirements met.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Tests pass (if test files touched).
- [ ] Screenshots updated (if UI changed).
- [ ] `changeguard ledger status` clean (or drift reconciled).

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
- `.agents/skills/onboarding/SKILL.md`
