import { apiGet } from "../api";
import { TrendPoint } from "@/lib/types";

export async function fetchTrends(days: number = 90): Promise<TrendPoint[]> {
  return apiGet<TrendPoint[]>("/trends", { days: days.toString() });
}
