import { apiGet } from "../api";
import { TrendPoint } from "@/lib/types";

// Coverage boundary: /api/trends not in openapi.json. Hand-declared UI type passed through.
export async function fetchTrends(days: number = 90): Promise<TrendPoint[]> {
  return apiGet<TrendPoint[]>("/trends", { days: days.toString() });
}
