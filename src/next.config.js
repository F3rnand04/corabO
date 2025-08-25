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
  // NEW: Explicitly mark server-only packages to prevent bundling issues.
  // This is the correct modern approach for the App Router.
  serverComponentsExternalPackages: ['@genkit-ai/googleai', 'handlebars'],
};

export default nextConfig;
