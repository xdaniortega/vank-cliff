'use client';

import { NotificationProvider, TransactionPopupProvider } from '@blockscout/app-sdk';
import { ReactNode } from 'react';

interface BlockscoutProviderProps {
  children: ReactNode;
}

export default function BlockscoutProvider({ children }: BlockscoutProviderProps) {
  return (
    <NotificationProvider>
      <TransactionPopupProvider>
        {children}
      </TransactionPopupProvider>
    </NotificationProvider>
  );
} 