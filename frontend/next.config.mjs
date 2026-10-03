/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep production verification separate from a running development server.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
};

export default nextConfig;
