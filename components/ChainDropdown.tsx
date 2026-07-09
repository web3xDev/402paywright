"use client";

import { useEffect, useRef, useState } from "react";
import { CHAINS, ACTIVE_CHAIN } from "@/lib/constants";

export function ChainDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors duration-150 ${
          open
            ? "border-accent"
            : "border-[var(--border)] hover:border-accent/50 hover:bg-accent/[0.06]"
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        <span className="hidden sm:inline">{ACTIVE_CHAIN.label}</span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
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
        aria-hidden={!open}
        className={`absolute right-0 z-30 mt-2 w-52 origin-top-right overflow-hidden rounded-lg border border-[var(--border)] bg-panel p-1 shadow-xl transition duration-150 ease-out ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {CHAINS.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={!c.active}
            tabIndex={open ? 0 : -1}
            onClick={() => c.active && setOpen(false)}
            className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${
              c.active
                ? "text-foreground enabled:hover:bg-white/5"
                : "cursor-not-allowed opacity-40"
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${c.active ? "bg-ok" : "bg-muted"}`}
              />
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
