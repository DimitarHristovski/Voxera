/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tauri works best with standalone output for desktop
  // For Vercel deployment, standalone is optional but still works
  output: 'standalone',
  // Disable image optimization for desktop app
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig

