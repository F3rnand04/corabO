/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
      }
    ],
  },
  webpack: (config, { isServer }) => {
    // Tell webpack to ignore watching the files that Genkit generates.
    // This prevents an infinite hot-reload loop.
    config.watchOptions = {
      ignored: [
        "**/.genkit/**",
        "**/.firebase/**",
        "**/genkit-log.json",
        "**/firebase-debug.log",
      ],
    };
    
    // FIX: Add problematic dependencies to externals to prevent webpack bundling errors.
    if (isServer) {
        config.externals = [...config.externals, "handlebars", "require-in-the-middle"];
    }
    
    return config;
  },
};

module.exports = nextConfig;
