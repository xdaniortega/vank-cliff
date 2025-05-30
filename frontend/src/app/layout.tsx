import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import DynamicProvider from '@/providers/DynamicProvider'
import { APP_TITLE, APP_DESCRIPTION, APP_KEYWORDS, APP_AUTHORS, APP_VIEWPORT } from '@/constants/app'

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  keywords: APP_KEYWORDS,
  authors: APP_AUTHORS,
  viewport: APP_VIEWPORT,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <DynamicProvider>
          {children}
        </DynamicProvider>
      </body>
    </html>
  )
} 