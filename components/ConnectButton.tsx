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
        className="btn-primary inline-flex h-9 items-center px-4 text-sm"
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
          className="inline-flex h-9 items-center rounded-lg border border-accent-2/50 bg-accent-2/10 px-3 text-xs font-medium text-accent-2"
        >
          Switch to Base Sepolia
        </button>
      )}
      <button
        onClick={() => open({ view: "Account" })}
        className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-sm font-medium transition hover:border-accent/40"
        aria-label="Wallet account"
      >
        <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ok" />
        <span className="font-mono">{short(address)}</span>
      </button>
    </div>
  );
}
