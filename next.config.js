/** @type {import('next').NextConfig} */
const nextConfig = {
  // config options here
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable standalone output for Docker only in production
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),
};

module.exports = nextConfig;
