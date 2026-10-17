import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for a small Docker image (see Dockerfile).
  output: "standalone",
  experimental: {
    // Keep visited/prefetched pages in the browser for 5 minutes so switching
    // tabs is instant. Every save clears this cache (see withUser), so data is never stale.
    staleTimes: { dynamic: 300, static: 300 },
  },
};

export default nextConfig;
