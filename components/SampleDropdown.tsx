"use client";

import { useState } from "react";
import { useMenuKeyboard } from "@/hooks/use-menu-keyboard";

type Sample = { label: string; url: string; method: string };

/** Compact picker for the sample endpoints — used on mobile where the chip
 *  row would overflow. Styled to match ChainDropdown. */
export function SampleDropdown({
  samples,
  onSelect,
}: {
  samples: Sample[];
  onSelect: (s: Sample) => void;
}) {
  const [open, setOpen] = useState(false);
  const { containerRef, triggerRef, triggerProps, menuProps, getItemProps } =
    useMenuKeyboard({
      open,
      setOpen,
      count: samples.length,
      role: "menu",
    });

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        {...triggerProps}
        onClick={(e) => {
          if (open) e.currentTarget.blur();
          setOpen((o) => !o);
        }}
        className={`inline-flex h-8 w-full items-center justify-between gap-2 rounded-lg border px-3 text-xs font-medium transition-colors duration-150 ${
          open
            ? "border-accent text-foreground"
            : "border-[var(--border)] text-muted hover:border-accent/50 hover:text-foreground"
        }`}
      >
        Try a sample endpoint
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
        {...menuProps}
        aria-label="Sample endpoints"
        className={`absolute left-0 z-30 mt-1.5 w-full origin-top overflow-hidden rounded-lg border border-[var(--border)] bg-panel p-1 shadow-xl transition duration-150 ease-out ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {samples.map((s, i) => (
          <button
            key={s.url}
            type="button"
            {...getItemProps(i)}
            role="menuitem"
            onClick={() => {
              onSelect(s);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs text-foreground outline-none transition-colors duration-150 hover:bg-white/5 focus:bg-white/10"
          >
            <span className="font-mono text-[10px] text-accent-2">{s.method}</span>
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
