import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import DynamicProvider from '@/providers/DynamicProvider'

export const metadata: Metadata = {
  title: 'CryptoManager - ETH Prague 2025',
  description: 'Advanced crypto portfolio management and trading platform',
  keywords: 'crypto, ethereum, portfolio, trading, defi, nft, blockchain',
  authors: [{ name: 'ETH Prague 2025 Team' }],
  viewport: 'width=device-width, initial-scale=1',
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