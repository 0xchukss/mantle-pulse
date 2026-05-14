import "dotenv/config";
import { ethers } from "ethers";
import type { TransferEvent, TxSummary } from "../types";

const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");
const ZERO_PAD = 64;

export const provider = new ethers.JsonRpcProvider(
  process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz",
  Number(process.env.MANTLE_CHAIN_ID || 5003)
);

function topicAddress(address: string): string {
  return ethers.zeroPadValue(ethers.getAddress(address), 32);
}

function shortenValue(value: bigint): string {
  try {
    return ethers.formatUnits(value, 18);
  } catch {
    return value.toString();
  }
}

async function timestampFor(blockNumber: number): Promise<number> {
  try {
    return await getBlockTimestamp(blockNumber);
  } catch {
    return 0;
  }
}

export async function getRecentTransactions(address: string, count: number): Promise<TxSummary[]> {
  try {
    const currentBlock = await getCurrentBlock();
    const fromBlock = Math.max(0, currentBlock - 20_000);
    const normalized = ethers.getAddress(address);
    const [incoming, outgoing] = await Promise.all([
      provider.getLogs({
        fromBlock,
        toBlock: currentBlock,
        topics: [TRANSFER_TOPIC, null, topicAddress(normalized)]
      }),
      provider.getLogs({
        fromBlock,
        toBlock: currentBlock,
        topics: [TRANSFER_TOPIC, topicAddress(normalized)]
      })
    ]);

    const logs = [...incoming, ...outgoing]
      .sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index)
      .slice(0, count);

    const timestamps = new Map<number, number>();
    const summaries: TxSummary[] = [];

    for (const log of logs) {
      if (!timestamps.has(log.blockNumber)) {
        timestamps.set(log.blockNumber, await timestampFor(log.blockNumber));
      }
      const from = ethers.getAddress(`0x${log.topics[1].slice(-40)}`);
      const to = ethers.getAddress(`0x${log.topics[2].slice(-40)}`);
      const direction = from.toLowerCase() === normalized.toLowerCase() ? "out" : "in";
      summaries.push({
        hash: log.transactionHash,
        value: shortenValue(BigInt(log.data || "0x0")),
        timestamp: timestamps.get(log.blockNumber) || 0,
        direction,
        blockNumber: log.blockNumber,
        from,
        to
      });
    }

    return summaries;
  } catch (error) {
    console.error("getRecentTransactions failed:", error);
    return [];
  }
}

export async function getTokenTransfers(address: string, blocks: number): Promise<TransferEvent[]> {
  try {
    const currentBlock = await getCurrentBlock();
    const fromBlock = Math.max(0, currentBlock - blocks);
    const normalized = ethers.getAddress(address);
    const [incoming, outgoing] = await Promise.all([
      provider.getLogs({
        fromBlock,
        toBlock: currentBlock,
        topics: [TRANSFER_TOPIC, null, topicAddress(normalized)]
      }),
      provider.getLogs({
        fromBlock,
        toBlock: currentBlock,
        topics: [TRANSFER_TOPIC, topicAddress(normalized)]
      })
    ]);

    const seen = new Set<string>();
    const logs = [...incoming, ...outgoing]
      .filter((log) => {
        const key = `${log.transactionHash}:${log.index}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return log.topics.length >= 3 && log.data.length <= ZERO_PAD + 2;
      })
      .sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index);

    const timestamps = new Map<number, number>();
    const transfers: TransferEvent[] = [];

    for (const log of logs.slice(0, 100)) {
      if (!timestamps.has(log.blockNumber)) {
        timestamps.set(log.blockNumber, await timestampFor(log.blockNumber));
      }
      transfers.push({
        hash: log.transactionHash,
        token: ethers.getAddress(log.address),
        from: ethers.getAddress(`0x${log.topics[1].slice(-40)}`),
        to: ethers.getAddress(`0x${log.topics[2].slice(-40)}`),
        value: shortenValue(BigInt(log.data || "0x0")),
        blockNumber: log.blockNumber,
        timestamp: timestamps.get(log.blockNumber) || 0
      });
    }

    return transfers;
  } catch (error) {
    console.error("getTokenTransfers failed:", error);
    return [];
  }
}

export async function getMNTBalance(address: string): Promise<string> {
  try {
    const balance = await provider.getBalance(ethers.getAddress(address));
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("getMNTBalance failed:", error);
    return "0";
  }
}

export async function getCurrentBlock(): Promise<number> {
  return provider.getBlockNumber();
}

export async function getBlockTimestamp(blockNumber: number): Promise<number> {
  const block = await provider.getBlock(blockNumber);
  return block?.timestamp || 0;
}
