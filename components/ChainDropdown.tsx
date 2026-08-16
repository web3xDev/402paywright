"use client";

import { useState } from "react";
import { useMenuKeyboard } from "@/hooks/use-menu-keyboard";
import NetworkBaseSepolia from "@web3icons/react/icons/networks/NetworkBaseSepolia";
import NetworkBase from "@web3icons/react/icons/networks/NetworkBase";
import NetworkEthereum from "@web3icons/react/icons/networks/NetworkEthereum";
import NetworkArbitrumOne from "@web3icons/react/icons/networks/NetworkArbitrumOne";
import NetworkPolygon from "@web3icons/react/icons/networks/NetworkPolygon";
import { CHAINS, ACTIVE_CHAIN } from "@/lib/constants";

type IconProps = {
  size?: number;
  variant?: "branded" | "mono" | "background";
  className?: string;
};

const ICONS: Record<string, React.ComponentType<IconProps>> = {
  "base-sepolia": NetworkBaseSepolia,
  base: NetworkBase,
  ethereum: NetworkEthereum,
  arbitrum: NetworkArbitrumOne,
  polygon: NetworkPolygon,
};

function ChainIcon({ id, size }: { id: string; size: number }) {
  const Icon = ICONS[id];
  return Icon ? (
    <Icon size={size} variant="branded" className="shrink-0" />
  ) : null;
}

export function ChainDropdown() {
  const [open, setOpen] = useState(false);
  const { containerRef, triggerRef, triggerProps, menuProps, getItemProps } =
    useMenuKeyboard({
      open,
      setOpen,
      count: CHAINS.length,
      isDisabled: (i) => !CHAINS[i].active,
      initialIndex: Math.max(0, CHAINS.findIndex((c) => c.active)),
      role: "menu",
    });

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        {...triggerProps}
        aria-label={`Network: ${ACTIVE_CHAIN.label}`}
        onClick={(e) => {
          if (open) e.currentTarget.blur();
          setOpen((o) => !o);
        }}
        className={`inline-flex h-9 items-center gap-1 rounded-lg border px-2 text-sm font-medium transition-colors duration-150 min-[480px]:gap-2 min-[480px]:px-3 ${
          open
            ? "border-accent"
            : "border-[var(--border)] hover:border-accent/50 hover:bg-accent/[0.06]"
        }`}
      >
        <ChainIcon id={ACTIVE_CHAIN.id} size={18} />
        <span className="hidden whitespace-nowrap min-[480px]:inline">
          {ACTIVE_CHAIN.label}
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform min-[480px]:-ml-1 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {/* Kept mounted so the open/close transition runs both ways. */}
      <div
        {...menuProps}
        aria-label="Network"
        className={`absolute right-0 z-30 mt-2 w-52 origin-top-right overflow-hidden rounded-lg border border-[var(--border)] bg-panel p-1 shadow-xl transition duration-150 ease-out min-[400px]:w-56 ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {CHAINS.map((c, i) => (
          <button
            key={c.id}
            type="button"
            {...getItemProps(i)}
            role="menuitemradio"
            disabled={!c.active}
            aria-checked={c.id === ACTIVE_CHAIN.id}
            onClick={() => c.active && setOpen(false)}
            className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm outline-none transition-colors duration-150 ${
              c.active
                ? "text-foreground enabled:hover:bg-white/5 focus:bg-white/5"
                : "cursor-not-allowed opacity-40"
            }`}
          >
            <span className="flex items-center gap-2">
              {/* Green dot marks the live chain; empty slot keeps the
                  icons aligned on the coming-soon rows. */}
              {c.active ? (
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
              ) : (
                <span className="h-1.5 w-1.5 shrink-0" />
              )}
              <ChainIcon id={c.id} size={18} />
              {c.label}
            </span>
            {c.active ? (
              c.testnet && (
                <span className="font-mono text-[10px] text-accent-2">testnet</span>
              )
            ) : (
              <span className="rounded-full bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
                soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
