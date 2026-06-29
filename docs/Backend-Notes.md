# Backend Notes — moved

The frontend→backend contract (and the backend→frontend contract) now live in a single
bidirectional source of truth:

**`C:\dev\coordinated\coordination.md`**

Do not maintain contract details here. When the frontend adds a screen that needs an endpoint, or a
shared `src/lib/types.ts` shape changes, update `coordination.md` (§3.2 / §4) and the matching mock
service in `src/lib/**` in the same change. Keep the TypeScript interfaces in `coordination.md` §4 and
`src/lib/types.ts` identical. See `coordination.md` §10 (Coordination Protocol).
