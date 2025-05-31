import React from 'react';
import { colors, typography, spacing } from '@/theme/colors';

interface Balance {
  amount: number;
  nativeAmount?: number;
  nativeSymbol?: string;
}

interface AmountDisplayProps {
  balance: Balance | null;
  showMarginBottom?: boolean;
  isLoading?: boolean;
}

const AmountDisplay: React.FC<AmountDisplayProps> = ({ 
  balance, 
  showMarginBottom = true,
  isLoading = false
}) => {
  // Determine status message based on data availability
  const getStatusMessage = () => {
    if (isLoading) {
      return 'Fetching real-time data...';
    }
    
    if (balance?.nativeAmount && balance?.nativeSymbol) {
      return 'Live data from Blockscout';
    }
    
    return 'Updated just now';
  };

  const getStatusColor = () => {
    if (isLoading) {
      return '#f59e0b'; // amber for loading
    }
    
    if (balance?.nativeAmount && balance?.nativeSymbol) {
      return '#22c55e'; // green for live data
    }
    
    return '#6b7280'; // gray for static data
  };

  return (
    <div style={{
      position: 'relative',
      zIndex: 1,
      ...(showMarginBottom && { marginBottom: spacing.xl })
    }}>
      <p style={{
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        margin: '0 0 8px 0',
        lineHeight: 1,
        letterSpacing: '-0.02em',
        opacity: isLoading ? 0.7 : 1
      }}>
        ${balance?.amount.toFixed(2) || '0.00'}
      </p>
      
      {/* Show native token amount if available */}
      {balance?.nativeAmount && balance?.nativeSymbol && (
        <p style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.secondary,
          margin: '0 0 8px 0',
          lineHeight: 1,
          opacity: isLoading ? 0.7 : 1
        }}>
          {balance.nativeAmount.toFixed(6)} {balance.nativeSymbol}
        </p>
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          backgroundColor: getStatusColor(),
          borderRadius: '50%',
          animation: isLoading ? 'pulse 2s infinite' : 'none'
        }}></div>
        <p style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          margin: 0
        }}>
          {getStatusMessage()}
        </p>
      </div>
      
      {/* Add CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default AmountDisplay; 