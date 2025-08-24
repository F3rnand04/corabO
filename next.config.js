
/** @type {import('next').NextConfig} */

const nextConfig = {
  transpilePackages: [
    '@genkit-ai/core',
    '@genkit-ai/firebase',
    'genkit',
  ],

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
  
  webpack: (
    config,
    { isServer }
  ) => {
    // Genkit, and its dependency Handlebars, use 'require.extensions' which is not
    // supported by Webpack on the client side. Adding this to externals will prevent
    // Webpack from trying to bundle it for the browser.
    if (!isServer) {
        config.externals.push('@genkit-ai/googleai');
    }

    return config
  },
};

export default nextConfig;
