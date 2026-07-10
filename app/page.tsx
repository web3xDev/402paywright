"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { toast } from "sonner";
import { ConnectButton } from "@/components/ConnectButton";
import {
  probeX402,
  payX402,
  type ProbeResult,
  type PayResult,
  type RequestConfig,
} from "@/lib/x402-client";
import {
  CHAIN_ID,
  FAUCET_URL,
  ACTIVE_CHAIN,
  SAMPLE_ENDPOINTS,
  EXPLORER_TX,
} from "@/lib/constants";
import { readUsdcBalance, formatUsdc } from "@/lib/balance";
import { MethodSelect } from "@/components/MethodSelect";
import { ChainDropdown } from "@/components/ChainDropdown";
import { Footer } from "@/components/Footer";

const METHODS = ["GET", "POST"];

function short(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

/** Pull the first accepted payment out of the decoded requirements, defensively. */
function summarize(req: unknown) {
  if (!req || typeof req !== "object") return null;
  const r = req as Record<string, unknown>;
  const accepts = (Array.isArray(r.accepts) ? r.accepts : Array.isArray(req) ? req : [r]) as Record<
    string,
    unknown
  >[];
  const first = accepts[0];
  if (!first) return null;
  const amount = (first.maxAmountRequired ?? first.amount ?? first.value) as
    | string
    | number
    | undefined;
  let usdc: string | null = null;
  if (amount != null && /^\d+$/.test(String(amount))) {
    usdc = (Number(amount) / 1e6).toString();
  }
  return {
    scheme: first.scheme as string | undefined,
    network: first.network as string | undefined,
    amount: amount != null ? String(amount) : undefined,
    usdc,
    asset: first.asset as string | undefined,
    payTo: first.payTo as string | undefined,
    description: (first.description ?? r.error) as string | undefined,
  };
}

function Json({ value }: { value: unknown }) {
  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 2);
  return (
    <pre className="max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-black/30 p-3 font-mono text-xs leading-relaxed text-muted">
      {text || "(empty)"}
    </pre>
  );
}

function StatusBar({
  status,
  ok,
  ms,
}: {
  status: number;
  ok: boolean;
  ms?: number | null;
}) {
  const tone =
    status === 402
      ? "text-accent-2 bg-accent-2/10 ring-accent-2/30"
      : ok
        ? "text-ok bg-ok/10 ring-ok/30"
        : "text-red bg-red/10 ring-red/30";
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs">
      <span className={`rounded px-2 py-0.5 font-semibold ring-1 ${tone}`}>
        {status || "ERR"}
      </span>
      {ms != null && <span className="text-muted">{ms} ms</span>}
    </span>
  );
}

export default function Home() {
  const { address, chainId } = useConnection();
  const { data: walletClient } = useWalletClient();

  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [headersText, setHeadersText] = useState("");
  const [body, setBody] = useState("");

  const [probing, setProbing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [pay, setPay] = useState<PayResult | null>(null);
  const [probeMs, setProbeMs] = useState<number | null>(null);
  const [payMs, setPayMs] = useState<number | null>(null);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [respTab, setRespTab] = useState<"body" | "headers" | "receipt">("body");
  const probeSecRef = useRef<HTMLElement>(null);
  const paySecRef = useRef<HTMLElement>(null);

  // Scroll newly-revealed results into view so you don't have to hunt for them.
  useEffect(() => {
    if (probe)
      probeSecRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [probe]);
  useEffect(() => {
    if (pay)
      paySecRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pay]);

  const connected = !!address;
  const wrongChain = connected && chainId !== CHAIN_ID;

  const config: RequestConfig = useMemo(() => {
    const headers: Record<string, string> = {};
    for (const line of headersText.split("\n")) {
      const i = line.indexOf(":");
      if (i > 0) {
        const k = line.slice(0, i).trim();
        const v = line.slice(i + 1).trim();
        if (k) headers[k] = v;
      }
    }
    return { url: url.trim(), method, headers, body };
  }, [url, method, headersText, body]);

  const urlValid = /^https?:\/\/.+/.test(config.url);

  // Read the connected wallet's USDC balance (for display + pre-flight check).
  // A request token guards against out-of-order responses when the address
  // changes mid-flight.
  const balReqRef = useRef(0);
  const refreshBalance = useCallback(() => {
    if (!address || chainId !== CHAIN_ID) {
      setBalance(null);
      return;
    }
    const token = ++balReqRef.current;
    readUsdcBalance(address)
      .then((b) => token === balReqRef.current && setBalance(b))
      .catch(() => token === balReqRef.current && setBalance(null));
  }, [address, chainId]);

  // After a settled payment the public RPC can lag a beat before it reflects
  // the debit, so poll until the balance actually changes (or we give up).
  const pollBalanceAfterPay = useCallback(
    async (before: bigint | null) => {
      if (!address || chainId !== CHAIN_ID) return;
      const token = ++balReqRef.current;
      for (let i = 0; i < 6; i++) {
        await new Promise((res) => setTimeout(res, i === 0 ? 800 : 1500));
        if (token !== balReqRef.current) return; // superseded (e.g. account switch)
        try {
          const b = await readUsdcBalance(address);
          if (token !== balReqRef.current) return;
          setBalance(b);
          if (before == null || b !== before) return; // debit is now visible
        } catch {
          /* transient RPC error — keep trying */
        }
      }
    },
    [address, chainId],
  );

  // On account switch, drop the previous account's balance immediately so we
  // never flash a stale number while the new account's balance loads.
  useEffect(() => {
    setBalance(null);
  }, [address]);

  // Re-read on connect / account / chain switch, and whenever the tab regains
  // focus (e.g. after topping up at the faucet in another tab).
  useEffect(() => {
    refreshBalance();
    window.addEventListener("focus", refreshBalance);
    return () => window.removeEventListener("focus", refreshBalance);
  }, [refreshBalance]);

  async function onSend() {
    if (!urlValid) return;
    setProbe(null);
    setPay(null);
    setPayMs(null);
    setProbing(true);
    const t0 = Date.now();
    try {
      const r = await probeX402(config);
      setProbeMs(Date.now() - t0);
      setProbe(r);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setProbing(false);
    }
  }

  async function onPay() {
    if (!walletClient) return;
    // Pre-flight: enough USDC to cover the call?
    const s = summarize(probe?.requirements);
    if (balance != null && s?.amount && /^\d+$/.test(s.amount)) {
      if (balance < BigInt(s.amount)) {
        const msg = `Insufficient USDC — you have ${formatUsdc(balance)} but this call costs ${s.usdc ?? s.amount}.`;
        // Faucet only exists for Base Sepolia — don't offer it on mainnets
        // or other testnets we may activate later. Stack the link under the
        // message (JSX content) rather than the side-by-side action button.
        toast.error(
          ACTIVE_CHAIN.id === "base-sepolia" ? (
            <div className="flex flex-col gap-1.5">
              <span>{msg}</span>
              <a
                href={FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit font-medium text-accent underline-offset-2 transition-colors duration-150 hover:underline"
              >
                Get testnet USDC →
              </a>
            </div>
          ) : (
            msg
          ),
        );
        return;
      }
    }
    setPay(null);
    setRespTab("body");
    setPaying(true);
    const t0 = Date.now();
    try {
      const r = await payX402(walletClient, config);
      setPayMs(Date.now() - t0);
      setPay(r);
      if (r.ok) {
        toast.success("Payment settled onchain");
        // Poll (not a single read) so RPC lag doesn't leave a stale balance.
        pollBalanceAfterPay(balance);
      } else if (r.error) toast.error(r.error);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setPaying(false);
    }
  }

  const req = summarize(probe?.requirements);
  const receipt = (pay?.receipt ?? null) as Record<string, unknown> | null;
  const txHash =
    typeof receipt?.transaction === "string" ? receipt.transaction : null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-6 w-9 place-items-center rounded bg-accent font-mono text-xs font-bold text-[#1a0e08]">
            402
          </span>
          Paywright
        </div>
        <div className="flex items-center gap-2">
          <ChainDropdown />
          <ConnectButton />
        </div>
      </header>

      <div className="h-px w-full bg-[var(--border)]" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 pt-6">
        <div className="mb-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">
              Test any <span className="text-accent">x402</span> endpoint
            </h1>
            {ACTIVE_CHAIN.testnet && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1 font-mono text-xs text-accent-2">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-accent-2" />
                testnet
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted">
            Send a request, decode the 402 payment challenge, pay in USDC, and
            inspect the settled response. The Postman for x402.
          </p>
        </div>

        {/* Request builder */}
        <div className="panel p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <MethodSelect value={method} onChange={setMethod} methods={METHODS} />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              placeholder="https://api.example.com/paid-endpoint"
              className="field h-9 min-w-0 flex-1 px-3 font-mono text-sm placeholder:text-muted"
            />
            <button
              onClick={onSend}
              disabled={!urlValid || probing}
              className="btn-primary inline-flex h-9 items-center justify-center px-6 text-sm"
            >
              {probing ? "Sending…" : "Send"}
            </button>
          </div>

          <button
            onClick={() => setShowAdvanced((s) => !s)}
            className="mt-2.5 text-xs text-muted transition hover:text-foreground"
          >
            {showAdvanced ? "▾" : "▸"} Headers &amp; body
          </button>
          <div
            className={`grid transition-all duration-150 ease-out ${
              showAdvanced
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    Headers (one <span className="font-mono">Key: Value</span> per line)
                  </label>
                  <textarea
                    value={headersText}
                    onChange={(e) => setHeadersText(e.target.value)}
                    rows={4}
                    placeholder={"Authorization: Bearer …\nContent-Type: application/json"}
                    className="field w-full p-2.5 font-mono text-xs placeholder:text-muted"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    Body (for POST)
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={4}
                    placeholder={'{ "key": "value" }'}
                    className="field w-full p-2.5 font-mono text-xs placeholder:text-muted"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>Try:</span>
          {SAMPLE_ENDPOINTS.map((s) => (
            <button
              key={s.url}
              type="button"
              onClick={() => {
                setMethod(s.method);
                setUrl(s.url);
              }}
              className="rounded-full border border-[var(--border)] px-2.5 py-1 transition-colors duration-150 hover:border-accent/50 hover:text-foreground"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Probe result — the 402 challenge */}
        {probe && (
          <section ref={probeSecRef} className="mt-6 animate-in">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">1 · Payment challenge</span>
              <StatusBar status={probe.status} ok={probe.ok} ms={probeMs} />
              {probe.isX402 ? (
                <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent ring-1 ring-accent/30">
                  valid x402
                </span>
              ) : probe.status === 402 ? (
                <span className="rounded bg-accent-2/10 px-2 py-0.5 text-xs text-accent-2 ring-1 ring-accent-2/30">
                  402 but no requirements header
                </span>
              ) : (
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-muted ring-1 ring-[var(--border)]">
                  not an x402 challenge
                </span>
              )}
            </div>

            {req && (
              <div className="panel mb-3 grid gap-x-6 gap-y-2 p-4 text-sm sm:grid-cols-2">
                <Field label="scheme" value={req.scheme} mono />
                <Field label="network" value={req.network} mono />
                <Field
                  label="amount"
                  value={
                    req.usdc ? `${req.amount}  (≈ ${req.usdc} USDC)` : req.amount
                  }
                  mono
                />
                <Field label="pay to" value={req.payTo && short(req.payTo)} mono />
                <Field label="asset" value={req.asset && short(req.asset)} mono />
                {req.description && <Field label="note" value={req.description} />}
              </div>
            )}

            <div>
              <button
                onClick={() => setShowRaw((s) => !s)}
                className="flex items-center gap-1.5 py-1 text-xs text-muted transition-colors duration-150 hover:text-foreground"
              >
                <svg
                  className={`h-3 w-3 transition-transform duration-150 ${showRaw ? "rotate-90" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
                Raw challenge &amp; response
              </button>
              <div
                className={`grid transition-all duration-150 ease-out ${
                  showRaw
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div className="mt-2 grid gap-2">
                    <span className="text-xs text-muted">requirements</span>
                    <Json value={probe.requirements ?? probe.body} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pay step */}
            {probe.isX402 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {!connected ? (
                  <span className="text-sm text-muted">
                    Connect a wallet to pay and unlock.
                  </span>
                ) : wrongChain ? (
                  <span className="text-sm text-accent-2">
                    Switch to Base Sepolia to pay.
                  </span>
                ) : (
                  <button
                    onClick={onPay}
                    disabled={paying}
                    className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    {paying && (
                      <span className="h-3.5 w-3.5 animate-spin-slow rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {paying ? "Signing & settling…" : "Pay & unlock →"}
                  </button>
                )}
                <a
                  href={FAUCET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={`text-xs text-muted underline-offset-2 transition-colors duration-150 hover:text-foreground hover:underline ${
                    balance === 0n ? "animate-faucet-pulse" : ""
                  }`}
                >
                  Need testnet USDC?
                </a>
                {connected && !wrongChain && balance != null && (
                  <span className="text-xs text-muted">
                    Balance:{" "}
                    <span className="font-mono text-foreground">
                      {formatUsdc(balance)} USDC
                    </span>
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        {/* Pay result — the unlocked response */}
        {pay && (
          <section ref={paySecRef} className="mt-6 animate-in">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">2 · Settled response</span>
              <StatusBar status={pay.status} ok={pay.ok} ms={payMs} />
              {pay.receipt != null && (
                <span className="rounded bg-ok/10 px-2 py-0.5 text-xs font-medium text-ok ring-1 ring-ok/30">
                  settled onchain
                </span>
              )}
            </div>

            {pay.error ? (
              <p className="rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red">
                {pay.error}
              </p>
            ) : (
              <div>
                {txHash && (
                  <a
                    href={`${EXPLORER_TX}${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-3 inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1 font-mono text-xs text-accent transition-colors duration-150 hover:border-accent/50"
                  >
                    {short(txHash)} · view settlement ↗
                  </a>
                )}
                <div className="flex gap-1 border-b border-[var(--border)]">
                  {(["body", "headers", "receipt"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setRespTab(t)}
                      className={`-mb-px border-b-2 px-3 py-1.5 text-xs capitalize transition-colors duration-150 ${
                        respTab === t
                          ? "border-accent text-foreground"
                          : "border-transparent text-muted hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="mt-2">
                  <div key={respTab} className="tab-enter">
                    <Json
                      value={
                        respTab === "body"
                          ? pay.body
                          : respTab === "headers"
                            ? pay.headers
                            : (pay.receipt ?? "(no payment-response header)")
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {!probe && (
          <p className="mt-8 text-center text-sm text-muted">
            Paste an x402 endpoint above and hit Send to see the payment flow.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value?: string | null;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="w-20 shrink-0 text-muted">{label}</span>
      <span className={`break-all text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
