import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { base, baseSepolia } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID ?? "";

/**
 * Both networks are offered — which one is "active" for balance/payment
 * purposes is a runtime choice made in lib/chain-context.tsx, not fixed
 * here. Listing both lets the wallet modal offer either, and lets our own
 * chain dropdown drive a switch between them via wagmi's useSwitchChain.
 */
export const networks: [typeof baseSepolia, typeof base] = [baseSepolia, base];

/**
 * wagmi config produced by the Reown AppKit adapter. SSR-safe cookie storage
 * keeps the connection across reloads (zero connect-flash via cookieToInitialState).
 */
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
