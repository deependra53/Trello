/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/:path*',
        destination: `${api}/api/:path*`,
      },
      {
        // Proxy locally-stored uploads to the backend (the `local` upload provider
        // returns relative /uploads/* URLs). S3/Cloudinary return absolute URLs.
        source: '/uploads/:path*',
        destination: `${api}/uploads/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
