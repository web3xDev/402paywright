import type { RequestConfig } from "./x402-client";

/** The editable request state, in the shape the page keeps it (headers as raw text). */
export type RequestDraft = {
  url: string;
  method: string;
  headersText: string;
  body: string;
};

// ---------------------------------------------------------------------------
// Share links — serialize the request into query params and back.
// ---------------------------------------------------------------------------

export function encodeRequestToParams(d: RequestDraft): string {
  const p = new URLSearchParams();
  p.set("url", d.url.trim());
  if (d.method && d.method !== "GET") p.set("method", d.method);
  if (d.headersText.trim()) p.set("headers", d.headersText);
  if (d.body.trim()) p.set("body", d.body);
  return p.toString();
}

export function decodeRequestFromParams(
  search: string,
): Partial<RequestDraft> | null {
  const p = new URLSearchParams(search);
  const url = p.get("url");
  if (!url) return null;
  return {
    url,
    method: p.get("method") ?? "GET",
    headersText: p.get("headers") ?? "",
    body: p.get("body") ?? "",
  };
}

// ---------------------------------------------------------------------------
// Code export — cURL and a plain fetch() snippet.
// ---------------------------------------------------------------------------

/** POSIX single-quote a string for a shell. */
function shq(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

export function toCurl(c: RequestConfig): string {
  const headers = c.headers ?? {};
  const lines = [`curl -X ${c.method} ${shq(c.url)}`];
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`  -H ${shq(`${k}: ${v}`)}`);
  }
  if (c.body && c.body.trim()) lines.push(`  --data ${shq(c.body)}`);
  return lines.join(" \\\n");
}

export function toFetchSnippet(c: RequestConfig): string {
  const headers = c.headers ?? {};
  const opts: string[] = [`  method: ${JSON.stringify(c.method)},`];
  if (Object.keys(headers).length) {
    opts.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},`);
  }
  if (c.body && c.body.trim()) opts.push(`  body: ${JSON.stringify(c.body)},`);
  return [
    "// This request returns the 402 challenge. To pay automatically, wrap",
    "// fetch with @x402/fetch's wrapFetchWithPayment(fetch, client).",
    `const res = await fetch(${JSON.stringify(c.url)}, {`,
    opts.join("\n"),
    "});",
    "console.log(res.status, await res.json());",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// History — last few requests, in localStorage.
// ---------------------------------------------------------------------------

const HISTORY_KEY = "paywright:history";
const HISTORY_MAX = 8;

export type HistoryItem = RequestDraft & { at: number };

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function pushHistory(draft: RequestDraft): HistoryItem[] {
  const url = draft.url.trim();
  if (!url) return loadHistory();
  // Dedupe by url + method so re-running the same call bubbles it to the top.
  const rest = loadHistory().filter(
    (h) => !(h.url === url && h.method === draft.method),
  );
  const next = [{ ...draft, url, at: Date.now() }, ...rest].slice(0, HISTORY_MAX);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota — history is best-effort */
  }
  return next;
}

export function clearHistory(): HistoryItem[] {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* ignore */
  }
  return [];
}
