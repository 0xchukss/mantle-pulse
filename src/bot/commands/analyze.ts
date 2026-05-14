import { ethers } from "ethers";
import type { Context } from "grammy";
import { analyzeWallet } from "../../lib/gemini";
import { getMNTBalance, getRecentTransactions, getTokenTransfers } from "../../lib/mantle";
import { formatMnt, shortAddress } from "../../lib/format";

function extractAddress(ctx: Context): string {
  const match = "match" in ctx ? String((ctx as Context & { match?: string }).match || "") : "";
  const text = ctx.message && "text" in ctx.message ? ctx.message.text || "" : "";
  return (match || text.replace(/^\/analyze(@\w+)?\s*/i, "")).trim().split(/\s+/)[0] || "";
}

export async function analyzeCommand(ctx: Context): Promise<void> {
  const address = extractAddress(ctx);
  if (!ethers.isAddress(address)) {
    await ctx.reply("❌ Invalid address. Usage: /analyze 0x1234...");
    return;
  }

  const normalized = ethers.getAddress(address);
  await ctx.reply("🔍 Analyzing wallet... (~10 seconds)");

  const [transactions, transfers, balance] = await Promise.all([
    getRecentTransactions(normalized, 50),
    getTokenTransfers(normalized, 5000),
    getMNTBalance(normalized)
  ]);

  const insight = await analyzeWallet({
    address: normalized,
    transactions,
    transfers,
    balance
  });

  const explorerTx = insight.txHash
    ? `\n\n🔗 Logged on-chain\nhttps://explorer.sepolia.mantle.xyz/tx/${insight.txHash}`
    : "\n\n🔗 On-chain logging pending. Set CONTRACT_ADDRESS after deployment.";

  await ctx.reply(`⚡ MantlePulse Analysis

Wallet: ${shortAddress(normalized)}
Balance: ${formatMnt(balance)} MNT

📊 ${insight.insightType}
${insight.summary}

💡 Signal: ${insight.actionableSignal}
Confidence: ${Math.round(insight.confidence * 100)}% | Risk: ${insight.riskLevel}${explorerTx}`);
}
