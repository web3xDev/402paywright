"use client";

import { useState } from "react";
import { useMenuKeyboard } from "@/hooks/use-menu-keyboard";

export const METHOD_COLOR: Record<string, string> = {
  GET: "text-ok",
  POST: "text-accent-2",
};

export function MethodSelect({
  value,
  onChange,
  methods,
  className,
}: {
  value: string;
  onChange: (m: string) => void;
  methods: string[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { containerRef, triggerRef, triggerProps, menuProps, getItemProps } =
    useMenuKeyboard({
      open,
      setOpen,
      count: methods.length,
      initialIndex: Math.max(0, methods.indexOf(value)),
      role: "menu",
    });

  return (
    <div className={`relative sm:w-28 ${className ?? ""}`} ref={containerRef}>
      <button
        type="button"
        ref={triggerRef}
        {...triggerProps}
        onClick={(e) => {
          // Closing via the trigger keeps :focus, so the field's focus border
          // would linger until you click elsewhere — blur it on close.
          if (open) e.currentTarget.blur();
          setOpen((o) => !o);
        }}
        className={`field flex h-9 w-full items-center justify-between gap-1 px-2 font-mono text-[13px] font-semibold sm:px-3 sm:text-sm ${METHOD_COLOR[value] ?? ""}`}
      >
        {value}
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
        aria-label="HTTP method"
        className={`absolute left-0 z-30 mt-1.5 w-full min-w-28 origin-top overflow-hidden rounded-lg border border-[var(--border)] bg-panel p-1 shadow-xl transition duration-150 ease-out ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {methods.map((m, i) => (
          <button
            key={m}
            type="button"
            {...getItemProps(i)}
            role="menuitemradio"
            aria-checked={m === value}
            onClick={() => {
              onChange(m);
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 font-mono text-sm font-semibold outline-none transition-colors hover:bg-white/5 focus:bg-white/10 ${METHOD_COLOR[m] ?? ""}`}
          >
            {m}
            {m === value && <span className="text-muted">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
