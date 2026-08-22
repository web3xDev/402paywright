import {
  wrapFetchWithPayment,
  x402Client,
  decodePaymentResponseHeader,
} from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import type { Network } from "@x402/core/types";
import type { WalletClient } from "viem";

export type RequestConfig = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
};

export type ProbeResult = {
  status: number;
  ok: boolean;
  /** Decoded `payment-required` header (the x402 accepts array), or null. */
  requirements: unknown;
  /** Whether the endpoint returned a well-formed 402 challenge. */
  isX402: boolean;
  headers: Record<string, string>;
  body: unknown;
};

export type PayResult = {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: unknown;
  /** Decoded `payment-response` header (the settlement receipt), or null. */
  receipt: unknown;
  payer: string;
  error?: string;
};

type TypedDataMessage = {
  domain: Record<string, unknown>;
  types: Record<string, unknown>;
  primaryType: string;
  message: Record<string, unknown>;
};

/** Adapt a connected viem WalletClient into the x402 ClientEvmSigner shape. */
function signerFromWallet(wallet: WalletClient) {
  const address = wallet.account!.address;
  const signTypedData = wallet.signTypedData as (
    args: TypedDataMessage & { account: `0x${string}` },
  ) => Promise<`0x${string}`>;
  return {
    address,
    signTypedData: (msg: TypedDataMessage) =>
      signTypedData({ account: address, ...msg }),
  };
}

function buildInit(config: RequestConfig): RequestInit {
  const init: RequestInit = { method: config.method, cache: "no-store" };
  if (config.headers && Object.keys(config.headers).length) {
    init.headers = config.headers;
  }
  const method = config.method.toUpperCase();
  if (config.body && method !== "GET" && method !== "HEAD") {
    init.body = config.body;
  }
  return init;
}

function headersToObject(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

function decodeRequirements(header: string | null): unknown {
  if (!header) return null;
  try {
    return JSON.parse(atob(header));
  } catch {
    try {
      return JSON.parse(header);
    } catch {
      return header;
    }
  }
}

function safeJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeHeaders(h?: HeadersInit): Record<string, string> {
  const out: Record<string, string> = {};
  if (!h) return out;
  if (h instanceof Headers) {
    h.forEach((v, k) => (out[k] = v));
  } else if (Array.isArray(h)) {
    for (const [k, v] of h) out[k] = v;
  } else {
    Object.assign(out, h);
  }
  return out;
}

/**
 * fetch() that routes through our same-origin /api/proxy so the browser can
 * reach any x402 endpoint without CORS. Passed to both the probe and (via
 * wrapFetchWithPayment) the paid retry, so the whole HTTP flow avoids CORS
 * while payment signing stays client-side.
 */
async function proxyFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let url: string;
  let reqMethod: string | undefined;
  let reqHeaders: Record<string, string> = {};
  let reqBody: string | undefined;

  // The x402 client retries by passing a Request object (with the payment
  // header on it), not via `init` — so pull method/headers/body off the
  // Request too, then let an explicit `init` override.
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else {
    url = input.url;
    reqMethod = input.method;
    reqHeaders = normalizeHeaders(input.headers);
    if (input.body) {
      try {
        reqBody = await input.clone().text();
      } catch {
        /* body not readable — leave undefined */
      }
    }
  }

  const method = (init?.method ?? reqMethod ?? "GET").toUpperCase();
  const headers = { ...reqHeaders, ...normalizeHeaders(init?.headers) };
  const body = typeof init?.body === "string" ? init.body : reqBody;

  return fetch("/api/proxy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, method, headers, body }),
  });
}

/**
 * Unpaid probe: send the request and read the 402 challenge. No wallet needed.
 * This is the "inspect what the endpoint requires" step.
 */
export async function probeX402(config: RequestConfig): Promise<ProbeResult> {
  const res = await proxyFetch(config.url, buildInit(config));
  const text = await res.text();
  const requirements = decodeRequirements(res.headers.get("payment-required"));
  return {
    status: res.status,
    ok: res.ok,
    requirements,
    isX402: res.status === 402 && requirements != null,
    headers: headersToObject(res.headers),
    body: safeJson(text),
  };
}

/**
 * Paid call: `wrapFetchWithPayment` runs the full 402 -> sign (EIP-3009) ->
 * retry loop with the connected wallet. Returns the unlocked response + the
 * settlement receipt.
 */
export async function payX402(
  wallet: WalletClient,
  config: RequestConfig,
  network: string,
): Promise<PayResult> {
  const signer = signerFromWallet(wallet);
  const client = new x402Client().register(
    network as Network,
    new ExactEvmScheme(signer),
  );

  try {
    const fetchWithPay = wrapFetchWithPayment(proxyFetch as typeof fetch, client);
    const res = await fetchWithPay(config.url, buildInit(config));
    const text = await res.text();
    let receipt: unknown = null;
    const header = res.headers.get("payment-response");
    if (header) {
      try {
        receipt = decodePaymentResponseHeader(header);
      } catch {
        /* malformed receipt — leave null */
      }
    }
    return {
      status: res.status,
      ok: res.ok,
      headers: headersToObject(res.headers),
      body: safeJson(text),
      receipt,
      payer: signer.address,
    };
  } catch (err) {
    return {
      status: 0,
      ok: false,
      headers: {},
      body: null,
      receipt: null,
      payer: signer.address,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
