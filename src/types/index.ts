export type Direction = "in" | "out" | "unknown";

export interface TxSummary {
  hash: string;
  value: string;
  timestamp: number;
  direction: Direction;
  blockNumber: number;
  from?: string;
  to?: string;
}

export interface TransferEvent {
  hash: string;
  token: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
}

export interface PairData {
  id: string;
  name: string;
  token0: string;
  token1: string;
  volumeUSD: number;
  reserveUSD?: number;
  txCount?: number;
}

export interface SwapData {
  id: string;
  transaction: string;
  timestamp: number;
  pair: string;
  sender: string;
  recipient?: string;
  amountUSD: number;
  amount0?: string;
  amount1?: string;
  amount0In?: string;
  amount0Out?: string;
  amount1In?: string;
  amount1Out?: string;
}

export interface VolumeData {
  address: string;
  day: string;
  volumeUSD: number;
}

export interface WalletData {
  address: string;
  balance: string;
  transactions: TxSummary[];
  transfers: TransferEvent[];
}

export interface InsightResult {
  summary: string;
  insightType:
    | "whale_accumulation"
    | "unusual_outflow"
    | "protocol_interaction"
    | "arbitrage_pattern"
    | "dormant_activation";
  confidence: number;
  actionableSignal: string;
  riskLevel: "low" | "medium" | "high";
  txHash?: string;
  blockNumber?: number;
}

export interface Anomaly {
  address: string;
  ratio: number;
  volumeUSD: number;
}
