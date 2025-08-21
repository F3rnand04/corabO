
/** @type {import('next').NextConfig} */
import './src/env.mjs';

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
  webpack: (config) => {
    // This is the robust way to modify a read-only object.
    // Create a mutable copy of the watchOptions.
    const newWatchOptions = { ...config.watchOptions };

    // Ensure the `ignored` property is an array before pushing to it.
    const ignored = Array.isArray(newWatchOptions.ignored)
      ? [...newWatchOptions.ignored]
      : [];
      
    ignored.push(
      '**/.genkit/**',
      '**/.firebase/**',
      '**/genkit-log.json',
      '**/firebase-debug.log'
    );

    // Assign the new array to the copy.
    newWatchOptions.ignored = ignored;
    
    // Return a new config object with our modified watchOptions.
    return { ...config, watchOptions: newWatchOptions };
  },
};

export default nextConfig;
