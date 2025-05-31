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
}

const AmountDisplay: React.FC<AmountDisplayProps> = ({ 
  balance, 
  showMarginBottom = true
}) => {
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
        letterSpacing: '-0.02em'
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
          lineHeight: 1
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
          backgroundColor: '#22c55e',
          borderRadius: '50%'
        }}></div>
        <p style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
          margin: 0
        }}>
          {balance?.nativeAmount ? 'Live from Blockscout' : 'Updated just now'}
        </p>
      </div>
    </div>
  );
};

export default AmountDisplay; 