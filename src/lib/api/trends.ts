// /api/trends is PLANNED, not shipped (coordination.md §3.2, track 0013).
// The backend has no /api/trends route. This module is retained for the
// type export only — do NOT call apiGet('/trends') (guaranteed 404 + log
// spam). When /api/trends is built, replace this with the live fetch.
//
// See trends-data.ts for the synchronous planned/unavailable state.

export { type TrendPoint } from "@/lib/types";