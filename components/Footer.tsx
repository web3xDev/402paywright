import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-5 pb-4 pt-6 text-xs text-muted sm:flex-row sm:items-center">
        <span className="flex items-center gap-2">
          <span className="grid h-5 w-7 place-items-center rounded bg-accent font-mono text-[10px] font-bold text-[#1a0e08]">
            402
          </span>
          <span>
            <span className="font-semibold text-foreground">Paywright</span> ·
            the Postman for x402
          </span>
        </span>
        <div className="flex flex-col items-start gap-2 min-[360px]:flex-row min-[360px]:items-center min-[360px]:gap-5">
          <a
            href="https://flash402.xyz"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-150 hover:text-accent"
          >
            Flash402 ↗
          </a>
          <a
            href="https://x402.org"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-150 hover:text-foreground"
          >
            x402.org
          </a>
          <a
            href="https://github.com/web3xDev"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-150 hover:text-foreground"
          >
            GitHub
          </a>
          <span>
            built by{" "}
            <a
              href="https://github.com/web3xDev"
              target="_blank"
              rel="noreferrer"
              className="text-foreground transition-colors duration-150 hover:text-accent"
            >
              web3xDev
            </a>
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 pb-6 text-xs text-muted">
        <Link
          href="/privacy"
          className="transition-colors duration-150 hover:text-foreground"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          className="transition-colors duration-150 hover:text-foreground"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}
