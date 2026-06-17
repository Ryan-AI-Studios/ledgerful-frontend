import { apiGet } from "../api";
import { Hotspot } from "@/lib/types";

export async function fetchHotspots(days: number = 90): Promise<Hotspot[]> {
  const hotspots = await apiGet<Hotspot[]>("/hotspots", { days: days.toString() });
  
  // Ensure rank is populated based on the order returned (assuming API sorts by risk score)
  return hotspots.map((h, i) => ({
    ...h,
    rank: h.rank ?? i + 1
  }));
}
