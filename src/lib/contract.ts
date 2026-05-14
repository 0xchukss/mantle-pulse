import "dotenv/config";
import { ethers } from "ethers";
import { provider } from "./mantle";

const ABI = [
  "function logInsight(string calldata summaryHash, string calldata insightType) external",
  "function getInsightCount() external view returns (uint256)"
];

export function getContract(): ethers.Contract | null {
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
  const address = process.env.CONTRACT_ADDRESS;
  if (!privateKey || !address || !ethers.isAddress(address)) {
    return null;
  }
  const wallet = new ethers.Wallet(privateKey, provider);
  return new ethers.Contract(address, ABI, wallet);
}

export async function logInsight(
  summary: string,
  insightType: string
): Promise<{ txHash: string; blockNumber: number } | null> {
  try {
    const contract = getContract();
    if (!contract) {
      console.warn("CONTRACT_ADDRESS or DEPLOYER_PRIVATE_KEY missing; skipping on-chain log.");
      return null;
    }
    const summaryHash = ethers.keccak256(ethers.toUtf8Bytes(summary));
    const tx = await contract.logInsight(summaryHash, insightType);
    const receipt = await tx.wait(1);
    return {
      txHash: tx.hash,
      blockNumber: Number(receipt?.blockNumber || 0)
    };
  } catch (error) {
    console.error("logInsight failed:", error);
    return null;
  }
}

export async function getInsightCount(): Promise<number> {
  try {
    const contract = getContract();
    if (!contract) return 0;
    const count = await contract.getInsightCount();
    return Number(count);
  } catch (error) {
    console.error("getInsightCount failed:", error);
    return 0;
  }
}
