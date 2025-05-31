'use client';

import { useState, useCallback } from 'react';
import { useNotification } from '@blockscout/app-sdk';
import { useWalletInfo } from './useWalletInfo';

export interface TransactionMonitorResult {
  sendTransaction: (to: string, value: string, description?: string) => Promise<void>;
  isTransactionPending: boolean;
  lastTransactionHash: string | null;
  error: string | null;
}

export const useTransactionMonitor = (): TransactionMonitorResult => {
  const [isTransactionPending, setIsTransactionPending] = useState(false);
  const [lastTransactionHash, setLastTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { openTxToast } = useNotification();
  const { chainId, isConnected } = useWalletInfo();

  const sendTransaction = useCallback(async (
    to: string, 
    value: string, 
    description?: string
  ) => {
    if (!isConnected) {
      setError('Wallet not connected');
      return;
    }

    setIsTransactionPending(true);
    setError(null);

    try {
      // This is a mock transaction for demonstration
      // In a real app, you would use your wallet provider (Dynamic, viem, etc.)
      const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setLastTransactionHash(mockTxHash);
      
      // Show transaction toast with Blockscout SDK
      if (chainId) {
        await openTxToast(chainId, mockTxHash);
      }
      
      console.log(`Transaction sent: ${mockTxHash}`);
      console.log(`From: Connected Wallet`);
      console.log(`To: ${to}`);
      console.log(`Value: ${value} ETH`);
      console.log(`Description: ${description || 'Transaction'}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      console.error('Transaction error:', err);
    } finally {
      setIsTransactionPending(false);
    }
  }, [isConnected, chainId, openTxToast]);

  return {
    sendTransaction,
    isTransactionPending,
    lastTransactionHash,
    error
  };
}; 