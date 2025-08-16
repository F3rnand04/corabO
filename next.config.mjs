/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.postimg.cc',
        port: '',
        pathname: '/**',
      }
    ],
  },
  webpack: (config) => { // Añadimos la configuración de Webpack aquí
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

export default nextConfig;
