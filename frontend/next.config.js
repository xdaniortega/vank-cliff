const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true, // Disable default image optimization
  },
  assetPrefix: isProd ? '/vank-cliff/' : '',
  basePath: isProd ? '/vank-cliff' : '',
  output: 'export'
};

export default nextConfig;