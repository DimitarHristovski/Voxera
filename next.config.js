/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tauri works best with standalone output
  output: 'standalone',
  // Disable image optimization for desktop app
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

