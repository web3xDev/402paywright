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

/** A few known x402-gated endpoints to try in one click. */
export const SAMPLE_ENDPOINTS: { label: string; url: string; method: string }[] =
  [
    {
      label: "x402.org demo",
      url: "https://x402.org/protected",
      method: "GET",
    },
  ];
