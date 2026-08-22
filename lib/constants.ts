/**
 * Shared constants.
 *
 * Network is a runtime choice now, not a build-time one: the user switches
 * between Base Sepolia (testnet) and Base mainnet from the chain dropdown
 * (see lib/chain-context.tsx + components/ChainDropdown.tsx). Everything
 * that used to be a single derived value (NETWORK, CHAIN_ID, USDC_ADDRESS,
 * explorer links) now lives per-row on CHAINS and is looked up through
 * getChain()/useChain() instead.
 *
 * Whichever endpoint you test still needs a facilitator that actually
 * settles on the chain you've selected — that's the seller's call, not
 * something this switch (or Paywright at all) controls. The 402 challenge
 * (PaymentRequirements) only carries `network`/`asset`/`payTo`, never a
 * facilitator URL, and verify/settle happens seller-side. The public
 * x402.org facilitator is testnet/dev-only by its own docs
 * (https://docs.x402.org/core-concepts/facilitator) and will not settle
 * mainnet payments no matter which network you've selected here. Known
 * Base-mainnet-capable facilitators as of writing:
 *   - Coinbase CDP — facilitator.cdp.coinbase.com — free up to 1,000
 *     settlements/mo, $0.001 each after (https://docs.cdp.coinbase.com/x402/network-support)
 *   - x402.rs      — facilitator.x402.rs — Base + Polygon, 0% fee
 *   - Heurist       — facilitator.heurist.xyz — Base, 0% fee
 *   - full/live list — https://facilitators.x402.watch
 */

/** Where to grab testnet USDC to pay with. */
export const FAUCET_URL = "https://faucet.circle.com/";

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
  /** CAIP-2 network id, for the x402 client. */
  network: string;
  label: string;
  /** true = testnet (drives the "testnet" badge + faucet link). */
  testnet: boolean;
  /** true = selectable in the chain dropdown today. */
  active: boolean;
  /** Block explorer base URL (no trailing slash) — drives tx/address links. */
  explorer: string;
  /** USDC contract on this chain (the asset x402 settles in). */
  usdcAddress: `0x${string}`;
};

// base-sepolia and base are both user-selectable; the rest stay on the
// roadmap (need their own facilitator + wagmi/AppKit wiring first).
export const CHAINS: Chain[] = [
  {
    id: "base-sepolia",
    chainId: 84532,
    network: "eip155:84532",
    label: "Base Sepolia",
    testnet: true,
    active: true,
    explorer: "https://sepolia.basescan.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  {
    id: "base",
    chainId: 8453,
    network: "eip155:8453",
    label: "Base",
    testnet: false,
    active: true,
    explorer: "https://basescan.org",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  { id: "ethereum", chainId: 1, network: "eip155:1", label: "Ethereum", testnet: false, active: false, explorer: "https://etherscan.io", usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  { id: "arbitrum", chainId: 42161, network: "eip155:42161", label: "Arbitrum", testnet: false, active: false, explorer: "https://arbiscan.io", usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  { id: "polygon", chainId: 137, network: "eip155:137", label: "Polygon", testnet: false, active: false, explorer: "https://polygonscan.com", usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },
];

/** Safe first-load default: testnet, never mainnet. */
export const DEFAULT_CHAIN: Chain = CHAINS[0];

export function getChain(id: string): Chain {
  return CHAINS.find((c) => c.id === id && c.active) ?? DEFAULT_CHAIN;
}
