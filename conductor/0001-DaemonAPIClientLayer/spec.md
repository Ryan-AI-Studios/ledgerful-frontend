# Track SPEC: 0001-DaemonAPIClientLayer — Daemon API Client Layer

## Objective

Replace hardcoded mock data services with typed HTTP clients that talk to the Ledgerful/ChangeGuard daemon, while keeping mock data as an offline fallback.

## Why This Matters

Every v1 screen currently uses hardcoded mock data in `src/lib/*-data.ts`. The UI looks real but cannot reflect actual repo state. A proper API client layer is the prerequisite for all other v2 tracks.

## Requirements

### Must Have
- Typed fetch client in `src/lib/api.ts`.
- Per-domain API modules: `dashboard.ts`, `changes.ts`, `ledger.ts`, `hotspots.ts`, `graph.ts`, `status.ts`.
- Error handling that surfaces backend failures in the UI.
- Mock services remain usable when the daemon is unreachable.
- `.env.example` with `NEXT_PUBLIC_LEDGERFUL_API_URL`.

### Should Have
- Request/response caching via React Query or SWR.
- Retry with exponential backoff for transient daemon failures.

### Won't Do
- GraphQL or gRPC — stick to REST/JSON for v2.
- WebSocket live updates (separate track).

## API / Data Contracts

All endpoints are assumed relative to `NEXT_PUBLIC_LEDGERFUL_API_URL` (default `http://localhost:52000`).

```ts
// src/lib/api.ts
export interface ApiError {
  status: number;
  message: string;
}

export async function apiGet<T>(path: string): Promise<T> {
  // throws ApiError on failure
}
```

Existing types in `src/lib/types.ts` become the shared contract between mock and live services.

## UI/UX Notes

- Loading states should reuse existing skeletons.
- Error states should match the dashboard error card pattern.
- No visual changes required unless data shapes change.

## Testing Strategy

- Unit tests for `api.ts` using `msw` or mocked fetch.
- Manual verification: toggle `NEXT_PUBLIC_LEDGERFUL_USE_MOCK=true` and confirm fallback.
- Screenshot updates only if error/loading states change visually.

## Definition of Done

- [ ] No placeholders or stubs remain in the implementation.
- [ ] `src/lib/api.ts` and all per-domain modules exist and are typed.
- [ ] Dashboard can render from live or mock data.
- [ ] Implementation reviewed by a subagent.
- [ ] Review findings addressed and verified by a subagent.
- [ ] `codex review` run on the uncommitted diff; findings addressed.
- [ ] Second `codex review` confirms no new critical/high findings.
- [ ] Manual end-to-end test of the API client layer passed.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] Tests pass (if added).
- [ ] Screenshots updated (if UI changed).
- [ ] `changeguard ledger status` clean.

## Related Documents

- `docs/product.md`
- `docs/design.md`
- `AGENTS.md`
- `.agents/skills/onboarding/SKILL.md`
