"use client";

import { useEffect, useRef, useState } from "react";

export const METHOD_COLOR: Record<string, string> = {
  GET: "text-ok",
  POST: "text-accent-2",
  PUT: "text-blue",
  DELETE: "text-red",
  PATCH: "text-purple",
};

export function MethodSelect({
  value,
  onChange,
  methods,
}: {
  value: string;
  onChange: (m: string) => void;
  methods: string[];
}) {
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
    <div className="relative sm:w-28" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`field flex w-full items-center justify-between px-3 py-2.5 font-mono text-sm font-semibold ${METHOD_COLOR[value] ?? ""}`}
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
        aria-hidden={!open}
        className={`absolute left-0 z-30 mt-1.5 w-full min-w-28 origin-top overflow-hidden rounded-lg border border-[var(--border)] bg-panel p-1 shadow-xl transition duration-150 ease-out ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {methods.map((m) => (
          <button
            key={m}
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              onChange(m);
              setOpen(false);
            }}
            className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 font-mono text-sm font-semibold transition-colors hover:bg-white/5 ${METHOD_COLOR[m] ?? ""}`}
          >
            {m}
            {m === value && <span className="text-muted">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
