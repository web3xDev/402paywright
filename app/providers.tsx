"use client";

import { WagmiProvider, type State } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createAppKit } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";
import { wagmiAdapter, projectId, networks } from "@/lib/wagmi";
import { ChainProvider } from "@/lib/chain-context";

const metadata = {
  name: "Paywright",
  description: "Test and inspect any x402 endpoint — the Postman for x402.",
  url: "https://paywright.xyz",
  icons: ["https://paywright.xyz/favicon.ico"],
};

// Create the AppKit modal once (dark, neon accent, wallet-only). Both
// networks are offered; defaultNetwork is the safe one (testnet) — mainnet
// is something the user opts into from the chain dropdown, never assumed.
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: baseSepolia,
  metadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#22d3ee",
    "--w3m-border-radius-master": "2px",
  },
  features: { analytics: true, email: false, socials: [] },
});

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <ChainProvider>{children}</ChainProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
