'use client';

import { colors, spacing, typography } from '@/theme/colors';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { APP_NAME } from '@/constants/app';

export default function LoginPage() {
  const { setShowAuthFlow } = useDynamicContext();

  const handleConnectWallet = () => {
    setShowAuthFlow(true);
  };

  return (
    <div 
      className="main-block-gradient"
      style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.xl
    }}>
      <div style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: spacing['2xl']
        }}>
          <h1 style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize['4xl'],
            fontWeight: typography.fontWeight.bold,
            color: colors.primary,
            marginBottom: spacing.md
          }}>
            {APP_NAME}
          </h1>
          <p style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            marginBottom: spacing.lg
          }}>
            Your comprehensive crypto portfolio management platform
          </p>
          <p style={{
            fontSize: typography.fontSize.base,
            color: colors.text.light
          }}>
            Connect your wallet to get started
          </p>
        </div>

        {/* Connect Button */}
        <div style={{
          backgroundColor: 'white',
          padding: spacing.xl,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 4px 12px ${colors.shadow}`,
          marginBottom: spacing.xl
        }}>
          <button
            onClick={handleConnectWallet}
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              padding: `${spacing.lg} ${spacing.xl}`,
              borderRadius: '12px',
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              cursor: 'pointer',
              width: '100%',
              fontFamily: typography.fontFamily,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.primary;
            }}
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
} 