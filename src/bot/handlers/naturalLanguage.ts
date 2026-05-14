import type { Context } from "grammy";
import { getAnomalyCount } from "../../jobs/anomalyScanner";
import { handleNaturalLanguage } from "../../lib/gemini";
import { getCurrentBlock } from "../../lib/mantle";
import { getTopPairs } from "../../lib/subgraph";

export async function naturalLanguageHandler(ctx: Context): Promise<void> {
  const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
  if (!text) return;

  const [block, pairs] = await Promise.all([
    getCurrentBlock().catch(() => 0),
    getTopPairs().catch(() => [])
  ]);

  const topPairs = pairs
    .slice(0, 3)
    .map((pair) => `${pair.name}: $${Math.round(pair.volumeUSD).toLocaleString("en-US")} volume`)
    .join("; ");

  const context = `Current block: ${block}. Top pairs: ${topPairs || "unavailable"}. Latest anomaly count: ${getAnomalyCount()}.`;
  const response = await handleNaturalLanguage(text, context);

  await ctx.reply(`${response}

💡 Try /analyze, /whales, /anomalies, or /pulse`);
}
