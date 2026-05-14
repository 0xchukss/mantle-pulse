import "dotenv/config";
import { gql, GraphQLClient } from "graphql-request";
import type { PairData, SwapData, VolumeData } from "../types";

const client = new GraphQLClient(process.env.SUBGRAPH_URL || "");

function unixDaysAgo(days: number): number {
  return Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;
}

function pairName(pool: any): string {
  const token0 = pool?.token0?.symbol || "TOKEN0";
  const token1 = pool?.token1?.symbol || "TOKEN1";
  return `${token0}/${token1}`;
}

function normalizeSwap(swap: any): SwapData {
  return {
    id: swap.id,
    transaction: swap.transaction?.id || swap.transaction || swap.id,
    timestamp: Number(swap.timestamp || 0),
    pair: swap.pool?.id || swap.pair?.id || "",
    sender: swap.sender || swap.origin || "",
    recipient: swap.recipient,
    amountUSD: Number(swap.amountUSD || 0),
    amount0: swap.amount0,
    amount1: swap.amount1,
    amount0In: swap.amount0In,
    amount0Out: swap.amount0Out,
    amount1In: swap.amount1In,
    amount1Out: swap.amount1Out
  };
}

export async function getTopPairs(): Promise<PairData[]> {
  try {
    const since = unixDaysAgo(1);
    const query = gql`
      query TopPairs($since: Int!) {
        pools(first: 10, orderBy: volumeUSD, orderDirection: desc) {
          id
          volumeUSD
          totalValueLockedUSD
          txCount
          token0 { id symbol }
          token1 { id symbol }
        }
        poolDayDatas(first: 10, where: { date_gt: $since }, orderBy: volumeUSD, orderDirection: desc) {
          id
          volumeUSD
          tvlUSD
          txCount
          pool {
            id
            token0 { id symbol }
            token1 { id symbol }
          }
        }
      }
    `;
    const data = await client.request<any>(query, { since });
    if (data.poolDayDatas?.length) {
      return data.poolDayDatas.map((day: any) => ({
        id: day.pool?.id || day.id,
        name: pairName(day.pool),
        token0: day.pool?.token0?.symbol || "",
        token1: day.pool?.token1?.symbol || "",
        volumeUSD: Number(day.volumeUSD || 0),
        reserveUSD: day.tvlUSD ? Number(day.tvlUSD) : undefined,
        txCount: day.txCount ? Number(day.txCount) : undefined
      }));
    }
    return (data.pools || []).map((pool: any) => ({
      id: pool.id,
      name: pairName(pool),
      token0: pool.token0?.symbol || pool.token0?.id || "",
      token1: pool.token1?.symbol || pool.token1?.id || "",
      volumeUSD: Number(pool.volumeUSD || 0),
      reserveUSD: pool.totalValueLockedUSD ? Number(pool.totalValueLockedUSD) : undefined,
      txCount: pool.txCount ? Number(pool.txCount) : undefined
    }));
  } catch (error) {
    console.error("getTopPairs failed:", error);
    return [];
  }
}

export async function getLargeSwaps(minUSD: number): Promise<SwapData[]> {
  try {
    const since = unixDaysAgo(1);
    const query = gql`
      query LargeSwaps($minUSD: BigDecimal!, $since: BigInt!) {
        swaps(
          first: 50
          where: { amountUSD_gt: $minUSD, timestamp_gt: $since }
          orderBy: amountUSD
          orderDirection: desc
        ) {
          id
          sender
          recipient
          origin
          amountUSD
          amount0
          amount1
          timestamp
          transaction { id }
          pool { id token0 { symbol } token1 { symbol } }
        }
      }
    `;
    const data = await client.request<any>(query, { minUSD: minUSD.toString(), since });
    return (data.swaps || []).map(normalizeSwap);
  } catch (error) {
    console.error("getLargeSwaps failed:", error);
    return [];
  }
}

export async function getWalletSwaps(address: string): Promise<SwapData[]> {
  try {
    const query = gql`
      query WalletSwaps($address: Bytes!) {
        swaps(first: 50, where: { sender: $address }, orderBy: timestamp, orderDirection: desc) {
          id
          sender
          recipient
          origin
          amountUSD
          amount0
          amount1
          timestamp
          transaction { id }
          pool { id token0 { symbol } token1 { symbol } }
        }
      }
    `;
    const data = await client.request<any>(query, { address: address.toLowerCase() });
    return (data.swaps || []).map(normalizeSwap);
  } catch (error) {
    console.error("getWalletSwaps failed:", error);
    return [];
  }
}

export async function get7DayVolumes(addresses: string[]): Promise<VolumeData[]> {
  try {
    const uniqueAddresses = [...new Set(addresses.map((a) => a.toLowerCase()).filter(Boolean))];
    if (!uniqueAddresses.length) return [];

    const since = unixDaysAgo(7);
    const query = gql`
      query SevenDayVolumes($addresses: [Bytes!], $since: BigInt!) {
        swaps(
          first: 1000
          where: { sender_in: $addresses, timestamp_gt: $since }
          orderBy: timestamp
          orderDirection: desc
        ) {
          sender
          timestamp
          amountUSD
        }
      }
    `;
    const data = await client.request<any>(query, { addresses: uniqueAddresses, since });
    const buckets = new Map<string, number>();
    for (const swap of data.swaps || []) {
      const day = new Date(Number(swap.timestamp) * 1000).toISOString().slice(0, 10);
      const key = `${swap.sender.toLowerCase()}:${day}`;
      buckets.set(key, (buckets.get(key) || 0) + Number(swap.amountUSD || 0));
    }
    return [...buckets.entries()].map(([key, volumeUSD]) => {
      const [address, day] = key.split(":");
      return { address, day, volumeUSD };
    });
  } catch (error) {
    console.error("get7DayVolumes failed:", error);
    return [];
  }
}
