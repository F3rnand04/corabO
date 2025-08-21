/** @type {import('next').NextConfig} */
import './src/env.mjs';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  webpack: (config) => {
    // Ensure config.watchOptions.ignored is an array before attempting to modify it.
    // This is a robust way to prevent the "not iterable" error.
    if (!Array.isArray(config.watchOptions.ignored)) {
      config.watchOptions.ignored = [];
    }
    
    config.watchOptions.ignored.push(
      '**/.genkit/**',
      '**/.firebase/**',
      '**/genkit-log.json',
      '**/firebase-debug.log',
    );
    
    return config;
  },
};

export default nextConfig;
