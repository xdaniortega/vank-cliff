'use client';

import { colors, spacing, typography } from '@/theme/colors';
import LoadingSpinner from './LoadingSpinner';

interface LoadingCardProps {
  title?: string;
  showSpinner?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export default function LoadingCard({ 
  title = 'Loading...', 
  showSpinner = true, 
  children,
  className = '' 
}: LoadingCardProps) {
  return (
    <div 
      className={`main-block-gradient-light ${className}`}
      style={{
        backgroundColor: 'white',
        padding: spacing.xl,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 2px 8px ${colors.shadow}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px'
      }}
    >
      {showSpinner && (
        <div style={{ marginBottom: spacing.lg }}>
          <LoadingSpinner size="large" />
        </div>
      )}
      
      <h3 style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        marginBottom: spacing.md,
        textAlign: 'center'
      }}>
        {title}
      </h3>
      
      {children && (
        <div style={{
          color: colors.text.light,
          fontSize: typography.fontSize.sm,
          textAlign: 'center',
          lineHeight: 1.5
        }}>
          {children}
        </div>
      )}
    </div>
  );
} 