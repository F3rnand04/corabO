
/** @type {import('next').NextConfig} */

const nextConfig = {
  webpack: (config, { isServer }) => {
    // This is the correct way to tell Next.js's bundler to not include
    // certain packages in the client-side bundle.
    if (!isServer) {
        config.externals = [
            ...config.externals, 
            '@google-cloud/firestore',
            'firebase-admin'
        ];
    }

    return config;
  },
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
