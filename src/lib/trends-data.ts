import { WithSource } from "@/lib/fallback";

export type { TrendPoint } from "@/lib/types";

// /api/trends is PLANNED, not shipped (coordination.md §3.2, track 0013).
// The backend has no /api/trends route — firing a request would be a
// guaranteed 404 + log spam. Return the planned/unavailable state
// synchronously instead. When /api/trends is built (future track), replace
// this with the live fetch + withFallback call.
export async function fetchTrends(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _days = 90,
): Promise<WithSource<import("@/lib/types").TrendPoint[]>> {
  return { data: [], source: "planned" };
}