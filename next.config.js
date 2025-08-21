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
    // This is a robust way to prevent TypeError: Cannot assign to read only property.
    // We create a new array based on the existing `ignored` property or an empty array,
    // and then push our additional paths to it.
    const ignored = [
      ...(Array.isArray(config.watchOptions.ignored) ? config.watchOptions.ignored : []),
      '**/.genkit/**',
      '**/.firebase/**',
      '**/genkit-log.json',
      '**/firebase-debug.log',
    ];
    
    config.watchOptions.ignored = ignored;
    
    return config;
  },
};

export default nextConfig;
