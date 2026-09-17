import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/site/site-footer'
import { SiteHeader } from '@/components/site/site-header'
import { getSiteUrl, isSiteIndexable, siteConfig } from '@/lib/site-config'

import './globals.css'

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.description,
  robots: {
    index: isSiteIndexable(),
    follow: isSiteIndexable(),
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    description: siteConfig.description,
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: 'website',
    url: '/',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#102a43',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
