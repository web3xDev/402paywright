import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import type { Chain as PaywrightChain } from "./constants";

/** Maps our CHAINS rows to the matching viem chain object for RPC reads. */
const VIEM_CHAINS: Record<string, typeof base | typeof baseSepolia> = {
  "base-sepolia": baseSepolia,
  base,
};

const USDC_BALANCE_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** Read the wallet's USDC balance on the given chain (base units, 6 decimals). */
export async function readUsdcBalance(
  address: string,
  chain: PaywrightChain,
): Promise<bigint> {
  const viemChain = VIEM_CHAINS[chain.id] ?? baseSepolia;
  const client = createPublicClient({ chain: viemChain, transport: http() });
  return client.readContract({
    address: chain.usdcAddress,
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
