'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export interface WalletInfo {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
}

export const useWalletInfo = (): WalletInfo => {
  const { primaryWallet, network } = useDynamicContext();

  if (!primaryWallet) {
    return {
      address: null,
      chainId: null,
      isConnected: false,
    };
  }

  return {
    address: primaryWallet.address || null,
    chainId: network ? String(network) : '1', // Default to Ethereum mainnet
    isConnected: true,
  };
}; 