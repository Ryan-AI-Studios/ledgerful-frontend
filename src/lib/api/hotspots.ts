import { apiGet } from "../api";
import { Hotspot, RiskLevel } from "@/lib/types";

interface HotspotResponse {
  id: string;
  filePath: string;
  riskLevel: RiskLevel;
  riskScore: number;
  lastTouchedAt: string | null;
  contributor: string | null;
  changeCount: number;
  rank: number;
}

export async function fetchHotspots(days: number = 90): Promise<Hotspot[]> {
  const hotspots = await apiGet<HotspotResponse[]>("/hotspots", { days: days.toString() });
  
  return hotspots.map((h) => ({
    id: h.id,
    filePath: h.filePath,
    riskLevel: h.riskLevel,
    riskScore: h.riskScore,
    // Fallback to empty string or current date if null to satisfy the UI interface
    lastTouchedAt: h.lastTouchedAt ?? new Date().toISOString(),
    contributor: h.contributor ?? undefined,
    changeCount: h.changeCount,
    rank: h.rank
  }));
}
