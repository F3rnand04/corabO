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
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'corabo-demo.web.app',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  webpack(config) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    // Excluye 'node-gyp-build' del bundle del cliente
    config.externals = config.externals || [];
    config.externals.push({
      'node-gyp-build': 'commonjs node-gyp-build',
    });
    return config;
  },
};

export default nextConfig;
