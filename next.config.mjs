/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@react-email/components',
      '@react-email/render',
      'react-hook-form',
      '@hookform/resolvers/zod',
      'lucide-react',
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ignored: [
        '**/.genkit/**', 
        '**/.firebase/**',
        '**/genkit-log.json',
        '**/firebase-debug.log',
      ],
    };

    // From src/next.config.js
    if (isServer) {
      config.externals.push('@opentelemetry/instrumentation', 'require-in-the-middle');
    }
    return config;
  },
};

export default nextConfig;
