/** @type {import('next').NextConfig} */
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
      }
    ],
  },
  webpack: (config) => {
    // Tell webpack to ignore watching the files that Genkit generates.
    // This prevents an infinite hot-reload loop.
    // Ensure config.watchOptions.ignored is an array before attempting to spread it.
    if (!Array.isArray(config.watchOptions.ignored)) {
        config.watchOptions.ignored = [];
    }
    
    config.watchOptions.ignored.push(
      "**/.genkit/**",
      "**/.firebase/**",
      "**/genkit-log.json",
      "**/firebase-debug.log",
    );
    
    return config;
  },
};

export default nextConfig;
