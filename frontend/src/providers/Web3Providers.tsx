"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Flow EVM chain config (chainId 747)
const flowEvmChain = {
  id: 747,
  name: "Flow EVM",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.evm.nodes.onflow.org"] },
  },
};

const wagmiConfig = createConfig({
  chains: [flowEvmChain],
  transports: {
    [flowEvmChain.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
} 