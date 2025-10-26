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
      'avatars.githubusercontent.com',
      'utfs.io' // UploadThing domain
    ],
  },
  // Increase body size limits for file uploads
  experimental: {
    serverComponentsExternalPackages: ['@uploadthing/react'],
  },
  // API route configuration
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Increase body size limit to 50MB
    },
  },
}

module.exports = nextConfig