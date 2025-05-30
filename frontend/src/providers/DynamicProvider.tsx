'use client';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { ReactNode } from 'react';
import { APP_NAME } from '@/constants/app';

interface DynamicProviderProps {
  children: ReactNode;
}

export default function DynamicProvider({ children }: DynamicProviderProps) {
  // If SKIP_LOGIN is set to 'true', don't initialize Dynamic SDK at all
  if (process.env.NEXT_PUBLIC_SKIP_LOGIN === 'true') {
    return <>{children}</>;
  }

  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  if (!environmentId) {
    console.error('NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID is not set');
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#e74c3c'
      }}>
        Dynamic Environment ID not configured. Please check your environment variables.
      </div>
    );
  }

  // Use type assertion to work around TypeScript issues
  const DynamicProvider = DynamicContextProvider as any;

  return (
    <DynamicProvider
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
        appName: APP_NAME,
        appLogoUrl: '/logo.png', // You can add a logo later
        
        // Customize the appearance
        cssOverrides: `
          .dynamic-widget-container {
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          }
          
          .dynamic-widget-button {
            border-radius: 8px !important;
            background: #6F2DBD !important;
            font-weight: 500 !important;
          }
          
          .dynamic-widget-button:hover {
            background: #A663CC !important;
          }
        `,
        
        // Custom events for handling authentication flow
        events: {
          onAuthInit: () => {
            console.log('Authentication initialized');
          },
          onAuthSuccess: (args: any) => {
            console.log('Authentication successful:', args);
          },
          onAuthFailure: (error: any, args: any) => {
            console.error('Authentication failed:', error, args);
          },
          onLogout: () => {
            console.log('User logged out');
          }
        }
      }}
    >
      {children}
    </DynamicProvider>
  );
} 