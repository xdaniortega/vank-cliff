'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { DollarSign, Zap, TrendingUp } from 'lucide-react';
import LoadingCard from './LoadingCard';

interface CompanyDashboardProps {
  isLoading: boolean;
}

const CurrencyAmountCard = ({ isLoading }: { isLoading: boolean }) => {
  const [amount, setAmount] = useState<string>('Loading...');
  const [isAmountLoading, setIsAmountLoading] = useState(true);

  useEffect(() => {
    // Simulate API call with 2-second timer
    const timer = setTimeout(() => {
      setAmount('$400.00');
      setIsAmountLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <LoadingCard title="Loading Currency..." showSpinner={true}>
        <p>Fetching current treasury balance...</p>
      </LoadingCard>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: spacing.xl,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 4px 12px ${colors.shadow}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '120px',
        height: '120px',
        background: `linear-gradient(135deg, ${colors.primary}15, ${colors.accent}10)`,
        borderRadius: '0 16px 0 100%'
      }} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        position: 'relative',
        zIndex: 1
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xs
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: colors.primary,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <DollarSign size={18} color="white" strokeWidth={2.5} />
            </div>
            <h3 style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              Treasury Balance
            </h3>
          </div>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            Available company funds
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: colors.mint,
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: '12px'
        }}>
          <TrendingUp size={12} color={colors.text.secondary} strokeWidth={2} />
          <span style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.medium
          }}>
            Live
          </span>
        </div>
      </div>

      {/* Amount Display */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        {isAmountLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            minHeight: '80px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: `3px solid ${colors.light}`,
              borderTop: `3px solid ${colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div>
              <div style={{
                width: '120px',
                height: '32px',
                backgroundColor: colors.light,
                borderRadius: '8px',
                marginBottom: spacing.xs
              }}></div>
              <div style={{
                width: '80px',
                height: '16px',
                backgroundColor: colors.border,
                borderRadius: '4px'
              }}></div>
            </div>
          </div>
        ) : (
          <div>
            <p style={{
              fontSize: typography.fontSize['4xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: '0 0 8px 0',
              lineHeight: 1,
              letterSpacing: '-0.02em'
            }}>
              {amount}
            </p>
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
                Updated just now
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ActionsCard = ({ isLoading }: { isLoading: boolean }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaySalaries = async () => {
    setIsProcessing(true);
    
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      alert('Pay Salaries functionality will be implemented here');
    }, 1500);
  };

  if (isLoading) {
    return (
      <LoadingCard title="Loading Actions..." showSpinner={true}>
        <p>Preparing company actions...</p>
      </LoadingCard>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: spacing.xl,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 4px 12px ${colors.shadow}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `linear-gradient(135deg, ${colors.secondary}08, ${colors.accent}05)`,
        zIndex: 0
      }} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        position: 'relative',
        zIndex: 1
      }}>
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xs
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: colors.secondary,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={18} color="white" strokeWidth={2.5} />
            </div>
            <h3 style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              Quick Actions
            </h3>
          </div>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            Manage company operations
          </p>
        </div>
      </div>

      {/* Action Button */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        <button 
          onClick={handlePaySalaries}
          disabled={isProcessing}
          style={{
            width: '100%',
            backgroundColor: isProcessing ? colors.text.secondary : colors.primary,
            color: 'white',
            border: 'none',
            padding: `${spacing.lg} ${spacing.xl}`,
            borderRadius: '12px',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease',
            boxShadow: isProcessing ? 'none' : `0 2px 8px ${colors.primary}30`
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}40`;
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 2px 8px ${colors.primary}30`;
            }
          }}
        >
          {isProcessing ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: `2px solid rgba(255, 255, 255, 0.3)`,
                borderTop: `2px solid white`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Processing Payment...
            </>
          ) : (
            <>
              <DollarSign size={18} strokeWidth={2} />
              Pay Salaries
            </>
          )}
        </button>
        
        {!isProcessing && (
          <p style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.light,
            margin: `${spacing.md} 0 0 0`,
            textAlign: 'center'
          }}>
            Process monthly salary payments to all employees
          </p>
        )}
      </div>
    </div>
  );
};

export default function CompanyDashboard({ isLoading }: CompanyDashboardProps) {
  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: spacing.xl,
        marginBottom: spacing.xl
      }}>
        <CurrencyAmountCard isLoading={isLoading} />
        <ActionsCard isLoading={isLoading} />
      </div>
    </div>
  );
}

// Add CSS for spinner animation (moved to proper place)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  if (!document.head.querySelector('style[data-animation="spin"]')) {
    style.setAttribute('data-animation', 'spin');
    document.head.appendChild(style);
  }
} 