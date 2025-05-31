import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import DynamicProvider from '@/providers/DynamicProvider'
import BlockscoutProvider from '@/providers/BlockscoutProvider'
import { APP_TITLE, APP_DESCRIPTION, APP_KEYWORDS, APP_AUTHORS, APP_VIEWPORT } from '@/constants/app'
// --- Wagmi imports ---
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Web3Providers from '@/providers/Web3Providers'

// Flow EVM chain config (chainId 747)
const flowEvmChain = {
  id: 747,
  name: 'Flow EVM',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet.evm.nodes.onflow.org'] }, // Cambia esto por el RPC de Flow EVM si tienes uno
  },
}

const wagmiConfig = createConfig({
  chains: [flowEvmChain],
  transports: {
    [flowEvmChain.id]: http(),
  },
})

const queryClient = new QueryClient()

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
        <link rel="icon" href="/VankCliff_Logo.svg" type="image/svg+xml" />
      </head>
      <body style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <Web3Providers>
          <DynamicProvider>
            <BlockscoutProvider>
              {children}
            </BlockscoutProvider>
          </DynamicProvider>
        </Web3Providers>
      </body>
    </html>
  )
} 