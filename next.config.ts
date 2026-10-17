import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server bundle for a small Docker image (see Dockerfile).
  output: "standalone",
};

export default nextConfig;
