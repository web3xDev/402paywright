import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack owns the build (a sibling lockfile
  // would otherwise confuse root inference).
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
