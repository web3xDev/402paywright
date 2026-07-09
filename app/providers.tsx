"use client";

import { WagmiProvider, type State } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { createAppKit } from "@reown/appkit/react";
import { baseSepolia } from "@reown/appkit/networks";
import { wagmiAdapter, projectId } from "@/lib/wagmi";

const metadata = {
  name: "x402 Playground",
  description: "Test and inspect any x402 endpoint — the Postman for x402.",
  url: "https://x402playground.xyz",
  icons: ["https://x402playground.xyz/favicon.ico"],
};

// Create the AppKit modal once (dark, neon accent, wallet-only).
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [baseSepolia],
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
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
