const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

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
  async headers() {
    return [
      {
        // Allow CORS for email signup API from marketing sites
        source: '/api/email-signup',
        headers: [
          {
            key: 'Access-Control-Allow-Methods',
            value: 'POST, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      }
    ]
  },
};

module.exports = withNextIntl(nextConfig);
