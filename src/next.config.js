
/** @type {import('next').NextConfig} */
const nextConfig = {
  // The `transpilePackages` option is obsolete with the App Router.
  // Next.js now handles this automatically.
  // The custom webpack config is also no longer necessary.
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
