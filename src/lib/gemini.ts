import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InsightResult, PairData, SwapData, WalletData } from "../types";
import { logInsight as logInsightOnChain } from "./contract";

const fallbackInsight: InsightResult = {
  summary: "MantlePulse could not complete AI analysis right now, but the wallet data was fetched successfully.",
  insightType: "protocol_interaction",
  confidence: 0.35,
  actionableSignal: "Retry shortly or compare this wallet against fresh /pulse data before acting.",
  riskLevel: "medium"
};

function model() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.5-flash" });
}

function stripJson(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function normalizeInsight(parsed: any): InsightResult {
  const allowedTypes = new Set([
    "whale_accumulation",
    "unusual_outflow",
    "protocol_interaction",
    "arbitrage_pattern",
    "dormant_activation"
  ]);
  const riskLevels = new Set(["low", "medium", "high"]);
  return {
    summary: String(parsed.summary || fallbackInsight.summary),
    insightType: allowedTypes.has(parsed.insightType) ? parsed.insightType : "protocol_interaction",
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? fallbackInsight.confidence))),
    actionableSignal: String(parsed.actionableSignal || fallbackInsight.actionableSignal),
    riskLevel: riskLevels.has(parsed.riskLevel) ? parsed.riskLevel : "medium"
  };
}

export async function analyzeWallet(walletData: WalletData): Promise<InsightResult> {
  try {
    const gemini = model();
    if (!gemini) return fallbackInsight;

    const prompt = `SYSTEM: You are MantlePulse, an expert on-chain analyst for the Mantle blockchain.
Analyze wallet transaction data and generate actionable alpha insights for traders.
Be concise, specific, and always explain WHY something is notable.
Respond ONLY with a valid JSON object - no preamble, no markdown fences, no extra text.
JSON shape: { "summary": string, "insightType": string, "confidence": number, "actionableSignal": string, "riskLevel": string }
insightType must be exactly one of: "whale_accumulation" | "unusual_outflow" | "protocol_interaction" | "arbitrage_pattern" | "dormant_activation"
confidence: float 0.0 to 1.0
riskLevel: "low" | "medium" | "high"

DATA: ${JSON.stringify(walletData)}`;

    const result = await gemini.generateContent(prompt);
    const insight = normalizeInsight(JSON.parse(stripJson(result.response.text())));
    const onChain = await logInsightOnChain(insight.summary, insight.insightType);
    return {
      ...insight,
      txHash: onChain?.txHash,
      blockNumber: onChain?.blockNumber
    };
  } catch (error) {
    console.error("analyzeWallet failed:", error);
    return fallbackInsight;
  }
}

export async function getMarketPulse(topPairs: PairData[], largeSwaps: SwapData[]): Promise<string> {
  try {
    const gemini = model();
    if (!gemini) {
      return "Signal: AI pulse is unavailable right now.\nFlow: Live Mantle data was fetched, but Gemini is not configured.\nAction: Try /anomalies or /analyze for raw wallet signals.";
    }
    const prompt = `You are MantlePulse. Given Mantle DEX data below, write a 3-bullet market pulse for traders.
Format: one emoji + one sentence per bullet. Max 30 words per bullet. Plain text only.
Cover: dominant trend, most unusual activity, one actionable takeaway.

TOP PAIRS: ${JSON.stringify(topPairs)}
LARGE SWAPS: ${JSON.stringify(largeSwaps)}`;

    const result = await gemini.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("getMarketPulse failed:", error);
    return "Signal: Mantle pulse is temporarily unavailable.\nFlow: Data or AI upstream timed out.\nAction: Retry /pulse in a minute.";
  }
}

export async function handleNaturalLanguage(userMessage: string, context: string): Promise<string> {
  try {
    const gemini = model();
    if (!gemini) {
      return "I can help with Mantle wallet intelligence, but Gemini is not configured. Try /pulse, /anomalies, or /analyze <address>.";
    }
    const prompt = `You are MantlePulse, a Telegram bot providing on-chain intelligence for Mantle Network.
Answer the user's question using the context below. Max 4 sentences. Plain text only - no markdown.
Wallet addresses go in backticks. If you cannot answer, say so and suggest a command.
Available commands: /analyze <address>, /whales, /anomalies, /pulse

CONTEXT: ${context}
USER: ${userMessage}`;

    const result = await gemini.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("handleNaturalLanguage failed:", error);
    return "I could not answer that safely right now. Try /pulse for market context or /analyze <address> for a wallet deep-dive.";
  }
}
