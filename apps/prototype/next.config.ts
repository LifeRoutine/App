import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Handy im LAN: http://192.168.178.28:3001 (sonst blockiert Next Dev JS/HMR)
  allowedDevOrigins: ["192.168.178.28", "localhost"],
};

export default nextConfig;
