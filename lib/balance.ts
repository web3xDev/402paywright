import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { USDC_ADDRESS } from "./constants";

const USDC_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** Read the wallet's USDC balance on Base Sepolia (base units, 6 decimals). */
export async function readUsdcBalance(address: string): Promise<bigint> {
  const client = createPublicClient({ chain: baseSepolia, transport: http() });
  return client.readContract({
    address: USDC_ADDRESS,
    abi: USDC_BALANCE_ABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });
}

/** Format base-unit USDC (6 decimals) to a short human string. */
export function formatUsdc(base: bigint): string {
  const n = Number(base) / 1e6;
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
