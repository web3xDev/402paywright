import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { baseSepolia } from "@reown/appkit/networks";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID ?? "";

/** Chains offered in the Reown AppKit modal. Base Sepolia for now. */
export const networks = [baseSepolia];

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
