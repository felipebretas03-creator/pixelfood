import type { NextConfig } from "next";

import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../'),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'http', hostname: 'localhost' }
    ],
  },
  allowedDevOrigins: ["192.168.1.4", "192.168.1.1", "192.168.1.2", "192.168.1.3", "192.168.1.5", "192.168.1.6", "192.168.1.7", "192.168.1.8", "192.168.1.9", "192.168.1.10"],
};

export default nextConfig;
