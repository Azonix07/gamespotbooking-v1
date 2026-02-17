/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript errors during build (auto-converted JSX pages)
  typescript: {
    ignoreBuildErrors: true,
  },
  // ── Performance: enable gzip/brotli and optimize output ──
  compress: true,
  poweredByHeader: false,
  // ── Reduce JS bundle size ──
  reactStrictMode: false,
  // ── Image optimization ──
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'steamcdn-a.akamaihd.net',
      },
      {
        protocol: 'https',
        hostname: 'shared.akamai.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'shared.fastly.steamstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'image.api.playstation.com',
      },
      {
        protocol: 'https',
        hostname: 'gmedia.playstation.com',
      },
      {
        protocol: 'https',
        hostname: 'gamespotbooking-v1-production.up.railway.app',
      },
    ],
  },
  // ── Performance headers ──
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://gamespotbooking-v1-production.up.railway.app',
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '556892794157-0ou93bns5ok2n32nk3nruhhnf4juog1h.apps.googleusercontent.com',
  },
  // Rewrites for API proxy in development
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://gamespotbooking-v1-production.up.railway.app'}/api/:path*`,
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
