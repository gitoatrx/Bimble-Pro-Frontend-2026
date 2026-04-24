import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.17.32.1", "172.16.172.111","172.16.172.160","172.16.172.177","ozone-unmanned-rocker.ngrok-free.dev"],
  async redirects() {
    return [
      {
        source: "/clinic/login",
        destination: "/login",
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
