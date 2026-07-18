import { NextResponse, type NextRequest } from "next/server";
import { assertPublicUrl } from "@/lib/ssrf";

/**
 * Same-origin proxy so the browser-side tool can reach ANY x402 endpoint
 * without hitting CORS. The server makes the request (no CORS enforcement)
 * and mirrors the target's status, headers, and body back. Payment signing
 * still happens client-side; only the HTTP hop goes through here.
 */

type ProxyBody = {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

// Headers that describe the transport encoding of the (already-decoded) body —
// forwarding them would corrupt the response the browser reconstructs.
const STRIP = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
  "keep-alive",
  // Never let an arbitrary target set cookies on our origin.
  "set-cookie",
  "set-cookie2",
]);

/**
 * Same-origin gate: this proxy exists only to serve Paywright's own frontend.
 * Require the request to come from a page on the same host (Origin, falling
 * back to Referer) so it can't be used as a general-purpose open proxy by
 * unrelated sites or scripts. (A non-browser client can forge these headers —
 * this stops casual/cross-site abuse, not a determined attacker; the rate limit
 * and SSRF guard are the other layers.)
 */
function sameOrigin(req: NextRequest): boolean {
  const host = req.headers.get("host");
  if (!host) return false;
  const source = req.headers.get("origin") ?? req.headers.get("referer");
  if (!source) return false;
  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/**
 * Crude in-memory sliding-window rate limit, keyed by client IP. Note: on
 * serverless this is per warm instance, so it bounds bursts rather than being a
 * global cap — swap in a shared store (Upstash/KV) if stronger limits are
 * needed. Good enough to blunt scripted abuse without an external dependency.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 40;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Opportunistic cleanup so the map can't grow unbounded.
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return recent.length > RATE_MAX;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function safeFetch(
  url: string,
  init: RequestInit,
): Promise<Response> {
  let current = url;
  for (let hop = 0; hop < 5; hop++) {
    await assertPublicUrl(current);
    const res = await fetch(current, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(20000),
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) return res;
      current = new URL(location, current).toString();
      continue;
    }
    return res;
  }
  throw new Error("too many redirects");
}

// Cap on the proxied response body. The target is fully user-supplied, so an
// oversized or endless body would otherwise be buffered whole into memory and
// exhaust the serverless function. 10 MB is plenty for any API response.
const MAX_BODY_BYTES = 10 * 1024 * 1024;

/**
 * Read the upstream body with a hard byte cap. Rejects early when the upstream
 * advertises an oversized Content-Length, and otherwise streams and bails the
 * moment the cap is crossed. Returns null when the body is too large.
 */
async function readBodyCapped(
  res: Response,
  cap: number,
): Promise<ArrayBuffer | null> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > cap) return null;
  if (!res.body) return new ArrayBuffer(0);

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > cap) return null;
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out.buffer;
}

export async function POST(req: NextRequest) {
  // Only Paywright's own frontend may use this proxy.
  if (!sameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Throttle bursts per client IP.
  if (rateLimited(clientIp(req))) {
    return NextResponse.json(
      { error: "Too many requests — slow down and try again shortly." },
      { status: 429, headers: { "retry-after": "30" } },
    );
  }

  let body: ProxyBody;
  try {
    body = (await req.json()) as ProxyBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json(
      { error: "url must be an http(s) URL" },
      { status: 400 },
    );
  }

  const method = (body.method ?? "GET").toUpperCase();
  const init: RequestInit = { method, headers: body.headers ?? undefined };
  if (body.body && method !== "GET" && method !== "HEAD") {
    init.body = body.body;
  }

  let upstream: Response;
  try {
    upstream = await safeFetch(url, init);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "Upstream request failed (unreachable or blocked address)",
      },
      { status: 502 },
    );
  }

  let buf: ArrayBuffer | null;
  try {
    buf = await readBodyCapped(upstream, MAX_BODY_BYTES);
  } catch {
    return NextResponse.json(
      { error: "Failed reading the upstream response" },
      { status: 502 },
    );
  }
  if (buf === null) {
    return NextResponse.json(
      {
        error: `Response too large — Paywright caps proxied responses at ${
          MAX_BODY_BYTES / (1024 * 1024)
        } MB.`,
      },
      { status: 413 },
    );
  }

  const res = new NextResponse(buf, { status: upstream.status });
  upstream.headers.forEach((value, key) => {
    if (!STRIP.has(key.toLowerCase())) res.headers.set(key, value);
  });
  return res;
}
