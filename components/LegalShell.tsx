import Link from "next/link";
import { Footer } from "@/components/Footer";

/** Shared chrome for the Privacy / Terms pages: logo bar, prose column, footer. */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="mx-auto flex w-full max-w-3xl items-center px-5 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight transition-opacity duration-150 hover:opacity-80"
        >
          <span className="grid h-6 w-9 place-items-center rounded bg-accent font-mono text-xs font-bold text-[#1a0e08]">
            402
          </span>
          Paywright
        </Link>
      </header>

      <div className="h-px w-full bg-[var(--border)]" />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-24 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted">Last updated: {updated}</p>

        <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted [&_a:hover]:underline [&_a]:text-accent [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
