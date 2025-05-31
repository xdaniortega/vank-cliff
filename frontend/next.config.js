/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true
  },
  // Ensure proper base path configuration for deployment
  basePath: '',
  // Ensure proper asset prefix 
  assetPrefix: '',
  // Disable service worker for static export
  experimental: {
    // Remove any experimental features that might cause issues
  },
  // Ensure proper compilation
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Configure headers for static files
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig 