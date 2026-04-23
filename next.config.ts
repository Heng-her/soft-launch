import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "https://systematic-feels-interesting-lawrence.trycloudflare.com",
  ],
  images: {
    qualities: [100, 75],
  },
};

export default nextConfig;
