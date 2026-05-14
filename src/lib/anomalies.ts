import type { Anomaly, SwapData, VolumeData } from "../types";
import { get7DayVolumes, getLargeSwaps } from "./subgraph";

export function detectAnomalies(largeSwaps: SwapData[], volumes: VolumeData[]): Anomaly[] {
  const today = new Date().toISOString().slice(0, 10);
  const dailyByAddress = new Map<string, Map<string, number>>();

  for (const volume of volumes) {
    const address = volume.address.toLowerCase();
    if (!dailyByAddress.has(address)) dailyByAddress.set(address, new Map());
    const days = dailyByAddress.get(address)!;
    days.set(volume.day, (days.get(volume.day) || 0) + volume.volumeUSD);
  }

  const live24h = new Map<string, number>();
  for (const swap of largeSwaps) {
    const address = (swap.sender || swap.recipient || "").toLowerCase();
    if (!address) continue;
    live24h.set(address, (live24h.get(address) || 0) + swap.amountUSD);
  }

  return [...live24h.entries()]
    .map(([address, volumeUSD]) => {
      const history = dailyByAddress.get(address);
      const historical = history
        ? [...history.entries()].filter(([day]) => day !== today).map(([, value]) => value)
        : [];
      const avg = historical.length
        ? historical.reduce((sum, value) => sum + value, 0) / historical.length
        : Math.max(volumeUSD / 4, 1);
      return {
        address,
        ratio: volumeUSD / Math.max(avg, 1),
        volumeUSD
      };
    })
    .filter((anomaly) => anomaly.ratio >= 3)
    .sort((a, b) => b.ratio - a.ratio);
}

export async function scanAnomalies(minUsd = 10_000): Promise<Anomaly[]> {
  const swaps = await getLargeSwaps(minUsd);
  const addresses = swaps.map((swap) => swap.sender || swap.recipient || "").filter(Boolean);
  const volumes = await get7DayVolumes(addresses);
  return detectAnomalies(swaps, volumes);
}
