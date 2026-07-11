"use client";

import { useAppKit } from "@reown/appkit/react";
import { useConnection } from "wagmi";
import { CHAIN_ID } from "@/lib/constants";

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Deterministic gradient avatar derived from the address (no external lib). */
function Avatar({ address }: { address: string }) {
  const a = address.toLowerCase();
  const h1 = parseInt(a.slice(2, 8), 16) % 360;
  const h2 = parseInt(a.slice(8, 14), 16) % 360;
  return (
    <span
      aria-hidden
      className="relative inline-block h-5 w-5 shrink-0 rounded-full ring-1 ring-white/10"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${h1} 65% 55%), hsl(${h2} 70% 45%))`,
      }}
    >
      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 animate-pulse-dot rounded-full border-2 border-[var(--background)] bg-ok" />
    </span>
  );
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
        <span className="sm:hidden">Connect</span>
        <span className="hidden sm:inline">Connect wallet</span>
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
          <span className="hidden sm:inline">Switch to Base Sepolia</span>
          <span className="sm:hidden">Wrong network</span>
        </button>
      )}
      <button
        onClick={() => open({ view: "Account" })}
        className="btn-ghost flex h-9 items-center gap-2 px-2 text-sm font-medium sm:px-3"
        aria-label="Wallet account"
      >
        <Avatar address={address} />
        <span className="hidden font-mono sm:inline">{short(address)}</span>
      </button>
    </div>
  );
}
