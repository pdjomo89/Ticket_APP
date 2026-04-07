import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "@convex": path.resolve(__dirname, "convex"),
    },
  },
};

export default nextConfig;
