import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    staticGenerationMaxConcurrency: 1,
    serverActions: {
      // Allow up to 16 MB to safely accommodate up to 10 MB résumé uploads
      // plus multipart form fields and cover letters. Default is 1 MB.
      bodySizeLimit: '16mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ursafbeufgmlxhxnflvh.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/security-policy',
        destination: '/security',
        permanent: true,
      },
      {
        source: '/admin/contacts',
        destination: '/admin/inquiries',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
