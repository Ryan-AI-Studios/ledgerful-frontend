import { TrendPoint } from "../types";

function generateMockTrends(days: number): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const wave = Math.sin(i * 0.3) * 20;
    const drift = Math.cos(i * 0.07) * 8;
    const score = Math.round(Math.max(0, Math.min(100, 55 + wave + drift)));
    const changes = 3 + ((i * 7 + 3) % 9);
    const highRiskCount = i % 7 === 0 ? (i % 14 === 0 ? 2 : 1) : 0;
    points.push({ date: dateStr, score, changes, highRiskCount });
  }
  return points;
}

const MOCK_TRENDS_90 = generateMockTrends(90);

export const MOCK_TRENDS: TrendPoint[] = MOCK_TRENDS_90;

export function fetchMockTrends(days = 90): Promise<TrendPoint[]> {
  const start = Math.max(0, MOCK_TRENDS_90.length - days);
  return Promise.resolve(MOCK_TRENDS_90.slice(start));
}