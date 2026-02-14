import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["https://tiffany-methodology-doubt-any.trycloudflare.com"],
  images: {
    qualities: [100, 75],
  },
};

export default nextConfig;