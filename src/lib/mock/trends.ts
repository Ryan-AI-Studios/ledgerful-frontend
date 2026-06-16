import { TrendPoint } from "@/lib/types";

export function fetchTrends(days: number = 90): Promise<TrendPoint[]> {
  const points: TrendPoint[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate somewhat realistic looking data
    const baseScore = 40 + Math.sin(i / 10) * 20;
    const randomNoise = Math.random() * 10;
    
    points.push({
      date: date.toISOString().split("T")[0],
      score: Math.min(100, Math.max(0, Math.round(baseScore + randomNoise))),
      changes: Math.floor(Math.random() * 10),
      highRiskCount: Math.floor(Math.random() * 3),
    });
  }
  
  return Promise.resolve(points);
}
