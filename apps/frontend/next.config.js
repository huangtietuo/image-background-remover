/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://image-background-remover.huangtietuo.workers.dev/api/:path*',
      },
      {
        source: '/remove-background',
        destination: 'https://image-background-remover.huangtietuo.workers.dev/remove-background',
      },
    ];
  },
};

module.exports = nextConfig;
