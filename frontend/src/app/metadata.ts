import type { Metadata, Viewport } from 'next'
import { APP_TITLE, APP_DESCRIPTION, APP_KEYWORDS, APP_AUTHORS, APP_VIEWPORT } from '@/constants/app'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  keywords: APP_KEYWORDS,
  authors: APP_AUTHORS,
  viewport: APP_VIEWPORT,
  icons: {
    icon: '/VankCliff_Logo.svg',
    shortcut: '/VankCliff_Logo.svg',
    apple: '/VankCliff_Logo.svg',
  },
} 