"use client";

import { useAppKit } from "@reown/appkit/react";
import { useConnection } from "wagmi";
import { CHAIN_ID } from "@/lib/constants";

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ConnectButton() {
  const { open } = useAppKit();
  const { address, chainId } = useConnection();

  if (!address) {
    return (
      <button
        onClick={() => open()}
        className="btn-neon rounded-lg px-4 py-2 text-sm font-semibold"
      >
        Connect wallet
      </button>
    );
  }

  const wrongChain = chainId !== CHAIN_ID;

  return (
    <div className="flex items-center gap-2">
      {wrongChain && (
        <button
          onClick={() => open({ view: "Networks" })}
          className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-400"
        >
          Switch to Base Sepolia
        </button>
      )}
      <button
        onClick={() => open({ view: "Account" })}
        className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium transition hover:border-neon/40"
        aria-label="Wallet account"
      >
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-neon-2" />
        <span className="font-mono">{short(address)}</span>
      </button>
    </div>
  );
}
