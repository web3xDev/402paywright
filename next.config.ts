import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack owns the build (a sibling lockfile
  // would otherwise confuse root inference).
  turbopack: {
    root: process.cwd(),
  },
  // Paywright's main action signs a real wallet payment — refuse to be
  // framed so a malicious site can't overlay deceptive UI and clickjack a
  // connected wallet into approving a payment it didn't mean to.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
    ];
  },
};

export default nextConfig;
