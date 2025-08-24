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
};

export default nextConfig;
