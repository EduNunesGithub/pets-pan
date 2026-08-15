import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { hostname: "*.public.blob.vercel-storage.com", protocol: "https" },
    ],
  },
  typedRoutes: true,
};

export default nextConfig;
