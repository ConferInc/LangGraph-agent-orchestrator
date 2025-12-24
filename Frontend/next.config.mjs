/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  // Allow LAN/dev origins for Next.js dev server to avoid CORS warnings
  allowedDevOrigins: ["http://localhost:3000", "http://127.0.0.1:3000", "http://10.83.0.159:3000"],
}

export default nextConfig
