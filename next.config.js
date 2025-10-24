/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds for deployment
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'ui-avatars.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com'
    ],
  },
}

module.exports = nextConfig