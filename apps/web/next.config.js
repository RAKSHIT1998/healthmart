const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: ['@buymedicines/shared'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'pharmeasy.in' },
      { protocol: 'https', hostname: 'cdn01.pharmeasy.in' },
      { protocol: 'https', hostname: 'www.netmeds.com' },
      { protocol: 'https', hostname: 'cdn.netmeds.com' },
    ],
  },
};

module.exports = nextConfig;
