import "dotenv/config";
import type { Bot } from "grammy";
import cron from "node-cron";
import { scanAnomalies } from "../lib/anomalies";
import { logInsight } from "../lib/contract";
import { formatUsd, shortAddress } from "../lib/format";

let lastAnomalies: Set<string> = new Set();
let lastCount = 0;

export function getAnomalyCount(): number {
  return lastCount;
}

export function startAnomalyScanner(bot: Bot): void {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const anomalies = await scanAnomalies(10_000);
      lastCount = anomalies.length;

      const current = new Set(anomalies.map((anomaly) => anomaly.address.toLowerCase()));
      const fresh = anomalies.filter((anomaly) => !lastAnomalies.has(anomaly.address.toLowerCase()));

      for (const anomaly of fresh) {
        const summary = `${shortAddress(anomaly.address)} shows a ${anomaly.ratio.toFixed(1)}x 24h volume spike with ${formatUsd(anomaly.volumeUSD)} routed through Mantle DEX flow.`;
        await logInsight(summary, "unusual_outflow");

        if (process.env.ALERT_CHAT_ID) {
          await bot.api.sendMessage(
            process.env.ALERT_CHAT_ID,
            `🚨 MantlePulse anomaly\n\n${summary}\n\nRun /analyze ${anomaly.address} for AI insight.`
          );
        }
      }

      lastAnomalies = current;
    } catch (error) {
      console.error("anomaly scanner failed:", error);
    }
  });
}
