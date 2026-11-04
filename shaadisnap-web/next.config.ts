import type { NextConfig } from "next";
import "./.next-mkdir-patch.cjs";

if (process.platform === "win32" && !process.env.NODE_OPTIONS?.includes(".next-mkdir-patch.cjs")) {
  process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ""} --require=./.next-mkdir-patch.cjs`.trim();
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
