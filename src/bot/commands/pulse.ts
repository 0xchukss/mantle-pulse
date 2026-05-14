import type { Context } from "grammy";
import { getMarketPulse } from "../../lib/gemini";
import { getLargeSwaps, getTopPairs } from "../../lib/subgraph";
import { utcStamp } from "../../lib/format";

export async function pulseCommand(ctx: Context): Promise<void> {
  await ctx.reply("📡 Reading Mantle market flow...");
  const [pairs, swaps] = await Promise.all([getTopPairs(), getLargeSwaps(5000)]);
  const pulse = await getMarketPulse(pairs, swaps);

  await ctx.reply(`📡 Mantle Pulse - ${utcStamp()} UTC

${pulse}

/anomalies for wallet-level signals.`);
}
