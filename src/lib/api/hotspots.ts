import { apiGet } from "../api";
import { Hotspot } from "@/lib/types";
import { normalizeHotspotRiskLevel } from "@/lib/risk";
import type { ExtractResponse } from "./contract-types";

type HotspotWire = ExtractResponse<"/api/hotspots", "get">;

export async function fetchHotspots(days: number = 90): Promise<Hotspot[]> {
  const hotspots = await apiGet<HotspotWire>("/hotspots", { days: days.toString() });

  return hotspots.map((h, i) => ({
    id: h.id,
    filePath: h.filePath,
    riskLevel: normalizeHotspotRiskLevel(h.riskLevel),
    riskScore: h.riskScore,
    // Preserve null — never invent a timestamp
    lastTouchedAt: h.lastTouchedAt ?? null,
    contributor: h.contributor ?? undefined,
    changeCount: h.changeCount,
    rank: h.rank ?? i + 1,
  }));
}
