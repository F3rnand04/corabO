/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  devIndicators: {
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // These packages are required by Genkit but can cause issues with Next.js's server-side bundling.
      // Externalizing them ensures they are resolved at runtime instead of compile time.
      config.externals = [...config.externals, 
        "@opentelemetry/instrumentation",
        "require-in-the-middle"
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
       {
        protocol: 'https',
        hostname: 'i.postimg.cc',
      }
    ],
  },
};

module.exports = nextConfig;
