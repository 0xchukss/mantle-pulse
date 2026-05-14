import type { Context } from "grammy";
import { getCurrentBlock, getMNTBalance } from "../../lib/mantle";
import { formatMnt, shortAddress } from "../../lib/format";

// TODO: Replace with curated Mantle protocol/deployer wallets once the production watchlist is finalized.
const WATCHLIST = [
  "0x0000000000000000000000000000000000000000",
  "0x1111111111111111111111111111111111111111",
  "0x2222222222222222222222222222222222222222",
  "0x3333333333333333333333333333333333333333",
  "0x4444444444444444444444444444444444444444",
  "0x5555555555555555555555555555555555555555",
  "0x6666666666666666666666666666666666666666",
  "0x7777777777777777777777777777777777777777"
];

export async function whalesCommand(ctx: Context): Promise<void> {
  await ctx.reply("🐋 Fetching smart money balances...");
  const currentBlock = await getCurrentBlock().catch(() => 0);
  const rows = await Promise.all(
    WATCHLIST.map(async (address, index) => {
      const balance = await getMNTBalance(address);
      return `${index + 1}. ${shortAddress(address)} - ${formatMnt(balance)} MNT - block #${currentBlock.toLocaleString("en-US")}`;
    })
  );

  await ctx.reply(`🐋 Smart Money Tracker

${rows.join("\n")}

Use /analyze <address> for AI deep-dive.`);
}
