"use client";

import { useMemo, useState } from "react";
import { useConnection, useWalletClient } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import {
  probeX402,
  payX402,
  type ProbeResult,
  type PayResult,
  type RequestConfig,
} from "@/lib/x402-client";
import { CHAIN_ID, FAUCET_URL } from "@/lib/constants";
import { MethodSelect } from "@/components/MethodSelect";
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
  const [headersText, setHeadersText] = useState("");
  const [body, setBody] = useState("");

  const [probing, setProbing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [pay, setPay] = useState<PayResult | null>(null);
  const [probeMs, setProbeMs] = useState<number | null>(null);
  const [payMs, setPayMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  async function onSend() {
    if (!urlValid) return;
    setError(null);
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
      setError(
        e instanceof Error
          ? `${e.message} — the endpoint may block cross-origin requests (CORS).`
          : String(e),
      );
    } finally {
      setProbing(false);
    }
  }

  async function onPay() {
    if (!walletClient) return;
    setError(null);
    setPay(null);
    setPaying(true);
    const t0 = Date.now();
    try {
      const r = await payX402(walletClient, config);
      setPayMs(Date.now() - t0);
      setPay(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPaying(false);
    }
  }

  const req = summarize(probe?.requirements);

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
        <ConnectButton />
      </header>

      <div className="h-px w-full bg-[var(--border)]" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-24 pt-6">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight">
            Test any <span className="text-accent">x402</span> endpoint
          </h1>
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
              className="field min-w-0 flex-1 px-3 py-2.5 font-mono text-sm placeholder:text-muted"
            />
            <button
              onClick={onSend}
              disabled={!urlValid || probing}
              className="btn-primary px-6 py-2.5 text-sm"
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
          {showAdvanced && (
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
                  Body (for POST / PUT / PATCH)
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
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red/30 bg-red/10 px-4 py-3 text-sm text-red">
            {error}
          </p>
        )}

        {/* Probe result — the 402 challenge */}
        {probe && (
          <section className="mt-6">
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

            <details className="text-xs text-muted">
              <summary className="cursor-pointer select-none py-1">
                Raw challenge &amp; response
              </summary>
              <div className="mt-2 grid gap-2">
                <span className="text-xs text-muted">requirements</span>
                <Json value={probe.requirements ?? probe.body} />
              </div>
            </details>

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
                  className="text-xs text-muted underline underline-offset-2 hover:text-foreground"
                >
                  Need testnet USDC?
                </a>
              </div>
            )}
          </section>
        )}

        {/* Pay result — the unlocked response */}
        {pay && (
          <section className="mt-6">
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
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-xs text-muted">response body</span>
                  <div className="mt-1">
                    <Json value={pay.body} />
                  </div>
                </div>
                <div>
                  <span className="text-xs text-muted">settlement receipt</span>
                  <div className="mt-1">
                    <Json value={pay.receipt ?? "(no payment-response header)"} />
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {!probe && !error && (
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
