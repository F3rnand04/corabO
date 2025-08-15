/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
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
    return config;
  },
};

module.exports = nextConfig;
