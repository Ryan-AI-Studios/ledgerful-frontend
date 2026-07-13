import { apiGet } from "../api";
import { TrendPoint } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type TrendsWire = ExtractResponse<"/api/trends", "get">;

export async function fetchTrends(days = 90): Promise<TrendPoint[]> {
  const res = await apiGet<TrendsWire>("/trends", { days: String(days) });
  return res.data.map((p) => ({
    date: p.date,
    score: p.score,
    changes: p.changes,
    highRiskCount: p.highRiskCount,
  }));
}