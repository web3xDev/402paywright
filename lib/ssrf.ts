import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF guard for the proxy: the server must never be tricked into fetching an
 * internal/reserved address (cloud metadata, localhost, private ranges). We
 * resolve the target host and reject if any address is non-public.
 */

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // this-host / private / loopback
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 (protocol assignments)
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast (224/4) + reserved (240/4)
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const x = ip.toLowerCase();
  if (x === "::1" || x === "::") return true; // loopback / unspecified
  if (x.startsWith("fc") || x.startsWith("fd")) return true; // fc00::/7 unique-local
  if (/^fe[89ab]/.test(x)) return true; // fe80::/10 link-local
  const mapped = x.match(/(?:::ffff:)(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return false;
}

function isPrivate(ip: string): boolean {
  const fam = isIP(ip);
  if (fam === 4) return isPrivateIPv4(ip);
  if (fam === 6) return isPrivateIPv6(ip);
  return true; // unknown -> treat as unsafe
}

/** Throws if the URL's host is (or resolves to) a private/internal address. */
export async function assertPublicUrl(rawUrl: string): Promise<void> {
  const host = new URL(rawUrl).hostname;

  if (isIP(host)) {
    if (isPrivate(host)) throw new Error("private address");
    return;
  }

  const addresses = await lookup(host, { all: true });
  if (addresses.length === 0) throw new Error("host did not resolve");
  for (const a of addresses) {
    if (isPrivate(a.address)) throw new Error("resolves to a private address");
  }
}
