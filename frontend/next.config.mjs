/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: { unoptimized: true },
  trailingSlash: true,
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
