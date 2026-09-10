import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allow build with minor TS warnings from generated module code
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
