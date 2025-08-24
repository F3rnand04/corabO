/** @type {import('next').NextConfig} */

const nextConfig = {
  // Use a dedicated 'src' directory for better project organization.
  srcDir: 'src',

  // Ensure server-only packages are not bundled on the client.
  webpack: (config, { isServer }) => {
    if (!isServer) {
        config.externals = [
            ...config.externals, 
            '@google-cloud/firestore',
            'firebase-admin'
        ];
    }
    return config;
  },

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
