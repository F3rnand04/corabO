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
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // This is the correct way to prevent server-only packages from being
    // bundled into the client-side code.
    if (!isServer) {
      config.externals.push('@genkit-ai/googleai');
      config.externals.push('handlebars');
    }
    return config;
  },
};

export default nextConfig;
