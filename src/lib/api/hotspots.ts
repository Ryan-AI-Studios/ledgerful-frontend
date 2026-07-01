import { apiGet } from "../api";
import { Hotspot } from "@/lib/types";
import type { ExtractResponse } from "./contract-types";

type HotspotWire = ExtractResponse<"/api/hotspots", "get">;

export async function fetchHotspots(days: number = 90): Promise<Hotspot[]> {
  const hotspots = await apiGet<HotspotWire>("/hotspots", { days: days.toString() });

  return hotspots.map((h, i) => ({
    id: h.id,
    filePath: h.filePath,
    riskLevel: h.riskLevel as Hotspot["riskLevel"],
    riskScore: h.riskScore,
    // Fallback to empty string or current date if null to satisfy the UI interface
    lastTouchedAt: h.lastTouchedAt ?? new Date().toISOString(),
    contributor: h.contributor ?? undefined,
    changeCount: h.changeCount,
    rank: h.rank ?? i + 1
  }));
}
