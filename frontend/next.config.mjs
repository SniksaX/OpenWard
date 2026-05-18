/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    distDir: 'dist',
    images: { unoptimized: true },
    trailingSlash: true, // Fixes the refresh issue
    typescript: { ignoreBuildErrors: true },
    eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;