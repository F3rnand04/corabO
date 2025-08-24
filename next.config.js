
/** @type {import('next').NextConfig} */

const nextConfig = {
  // Transpile Genkit packages to ensure compatibility with Next.js.
  // This is a common requirement for modern libraries that use newer JS features.
  transpilePackages: [
    '@genkit-ai/core',
    '@genkit-ai/firebase',
    '@genkit-ai/googleai',
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
    // supported by Webpack. Adding this to externals will prevent Webpack
    // from trying to bundle it.
    if (!isServer) {
        config.externals.push('@genkit-ai/googleai');
    }

    return config
  },
};

export default nextConfig;
