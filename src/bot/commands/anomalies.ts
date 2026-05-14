import type { Context } from "grammy";
import { formatUsd, shortAddress } from "../../lib/format";
import { scanAnomalies } from "../../lib/anomalies";

function severity(ratio: number): string {
  return ratio >= 7 ? "🔴" : "🟡";
}

export async function anomaliesCommand(ctx: Context): Promise<void> {
  await ctx.reply("🚨 Scanning Mantle DEX flow...");
  const anomalies = await scanAnomalies(10_000);

  if (!anomalies.length) {
    await ctx.reply("✅ No anomalies in the last 24h. Markets look calm.");
    return;
  }

  const rows = anomalies.slice(0, 10).map((item) => {
    return `${severity(item.ratio)} ${shortAddress(item.address)} - ${item.ratio.toFixed(1)}x spike - ${formatUsd(item.volumeUSD)} vol`;
  });

  await ctx.reply(`🚨 Anomaly Alerts

Unusual activity in the last 24h:

${rows.join("\n")}

Run /analyze <address> for AI insight.`);
}
