import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["https://necessary-forth-workers-plants.trycloudflare.com"],
  images: {
    qualities: [100, 75],
  },
};

export default nextConfig;