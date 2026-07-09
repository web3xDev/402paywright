/**
 * Shared constants. Base Sepolia testnet for now (the network the public
 * x402.org facilitator settles on).
 */

/** CAIP-2 network id. Base Sepolia testnet. */
export const NETWORK = "eip155:84532";

/** EVM chain id matching NETWORK, for wagmi. */
export const CHAIN_ID = 84532;

/** Circle USDC on Base Sepolia (the token x402 settles in on this network). */
export const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

/** Where to grab testnet USDC to pay with. */
export const FAUCET_URL = "https://faucet.circle.com/";

/** Base Sepolia block explorer — settlement tx links. */
export const EXPLORER_TX = "https://sepolia.basescan.org/tx/";

/** A few known x402-gated endpoints to try in one click. */
export const SAMPLE_ENDPOINTS: { label: string; url: string; method: string }[] =
  [
    {
      label: "Flash402 · currency API",
      url: "https://flash402.xyz/api/gw/d1425bbf",
      method: "GET",
    },
    {
      label: "x402.org demo",
      url: "https://x402.org/protected",
      method: "GET",
    },
  ];

export type Chain = {
  id: string;
  chainId: number;
  label: string;
  /** true = testnet (drives the "testnet" badge). */
  testnet: boolean;
  /** true = payments actually settle here today (public facilitator). */
  active: boolean;
};

// Only Base Sepolia settles today (public x402.org facilitator); the rest are
// on the roadmap (need a mainnet facilitator).
export const CHAINS: Chain[] = [
  { id: "base-sepolia", chainId: 84532, label: "Base Sepolia", testnet: true, active: true },
  { id: "base", chainId: 8453, label: "Base", testnet: false, active: false },
  { id: "ethereum", chainId: 1, label: "Ethereum", testnet: false, active: false },
  { id: "arbitrum", chainId: 42161, label: "Arbitrum", testnet: false, active: false },
  { id: "polygon", chainId: 137, label: "Polygon", testnet: false, active: false },
];

/** The chain payments run on right now. */
export const ACTIVE_CHAIN: Chain = CHAINS.find((c) => c.active) ?? CHAINS[0];
