"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  /** Optional visible label next to the icon (icon-only if omitted). */
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard blocked — nothing sensible to do */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label ?? "Copy"}
      className={`inline-flex items-center gap-1.5 text-muted transition-colors duration-150 hover:text-foreground ${
        copied ? "text-ok hover:text-ok" : ""
      } ${className ?? ""}`}
    >
      <svg
        className="h-3.5 w-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {copied ? (
          <path d="M20 6L9 17l-5-5" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      {label && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
