'use client';

import { colors } from '@/theme/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'medium', 
  color = colors.primary, 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeMap = {
    small: '16px',
    medium: '24px',
    large: '40px'
  };

  const spinnerSize = sizeMap[size];

  return (
    <div 
      className={className}
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `2px solid ${colors.border}`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );
}

// Add the CSS animation to global styles
export const spinnerCSS = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`; 