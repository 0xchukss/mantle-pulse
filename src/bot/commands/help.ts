import type { Context } from "grammy";

export const helpText = `⚡ MantlePulse

Real-time alpha signals from Mantle's on-chain activity.

/analyze <address> - AI analysis of any wallet
/whales - Track known smart money wallets
/anomalies - Latest volume spikes & unusual activity
/pulse - Current market sentiment summary
/help - Show this menu

Powered by Gemini AI x Mantle Network`;

export async function helpCommand(ctx: Context): Promise<void> {
  await ctx.reply(helpText);
}
