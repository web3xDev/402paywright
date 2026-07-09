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
]);

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

export async function POST(req: NextRequest) {
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

  const buf = await upstream.arrayBuffer();
  const res = new NextResponse(buf, { status: upstream.status });
  upstream.headers.forEach((value, key) => {
    if (!STRIP.has(key.toLowerCase())) res.headers.set(key, value);
  });
  return res;
}
