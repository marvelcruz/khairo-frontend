import type { NextConfig } from "next";

const sharedVoiceCoachApi = "https://fitlunge-voice-coach-api-preview.onrender.com/api/client-portal/voice-coach";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/voice-coach/:path*",
        destination: `${sharedVoiceCoachApi}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
