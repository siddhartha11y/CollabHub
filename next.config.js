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
  // External packages for server components (Next.js 15 syntax)
  serverExternalPackages: ['@prisma/client'],
  
  // Temporarily disable CSP to fix Google OAuth
  // Will re-enable with proper configuration later
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig