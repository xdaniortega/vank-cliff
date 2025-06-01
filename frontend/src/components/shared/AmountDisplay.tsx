import React from 'react';
import { colors, typography, spacing } from '@/theme/colors';
import { useBeneficiaryPayrolls } from '@/hooks/useBeneficiaryPayrolls';
import { formatAmount } from '@/utils/formatters';
import { useWalletInfo } from '@/hooks/useWalletInfo';
import { Clock, AlertCircle, Calendar, TrendingUp, CheckCircle, ArrowUpRight } from 'lucide-react';

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
  const { address: walletAddress } = useWalletInfo();
  const { payrolls, isLoading: isLoadingPayrolls } = useBeneficiaryPayrolls(walletAddress);

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

  // Calculate total unclaimed amount from active payrolls
  const totalUnclaimedAmount = payrolls
    .filter(p => p.isActive && !p.hasClaimed)
    .reduce((sum, p) => sum + p.amount, 0n);

  // Format date from timestamp
  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate vesting progress
  const calculateVestingProgress = (startTime: bigint, endTime: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    const total = endTime - startTime;
    const elapsed = now - startTime;
    const progress = Number((elapsed * 100n) / total);
    return Math.min(Math.max(progress, 0), 100);
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
      
      {/* Active Vestings Section */}
      {payrolls.length > 0 && (
        <div style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.light,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm
          }}>
            <Clock size={16} color={colors.text.secondary} />
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              Active Vestings
            </h4>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm
          }}>
            {payrolls.map((payroll) => {
              const progress = calculateVestingProgress(payroll.startTime, payroll.endTime);
              const isClaimable = payroll.isActive && !payroll.hasClaimed;
              
              return (
                <div key={payroll.id.toString()} style={{
                  padding: spacing.sm,
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Progress bar */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: colors.primary + '10',
                    zIndex: 0
                  }} />

                  <div style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary,
                        margin: '0 0 4px 0'
                      }}>
                        ${Number(payroll.amount) / 1e18}
                      </p>
                      <p style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.secondary,
                        margin: 0
                      }}>
                        {formatDate(payroll.startTime)} - {formatDate(payroll.endTime)}
                      </p>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}>
                      {isClaimable ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          color: colors.accent,
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.medium
                        }}>
                          <TrendingUp size={12} />
                          Claimable
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          color: colors.text.secondary,
                          fontSize: typography.fontSize.xs
                        }}>
                          <Clock size={12} />
                          {progress.toFixed(0)}%
                        </div>
                      )}
                      <ArrowUpRight size={14} color={colors.text.secondary} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Show active vestings section if there are any */}
      {!isLoadingPayrolls && payrolls.length > 0 && (
        <div style={{
          marginTop: spacing.md,
          padding: spacing.md,
          backgroundColor: colors.surface,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.sm
          }}>
            <TrendingUp size={16} color={colors.text.secondary} />
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              margin: 0
            }}>
              Active Vestings
            </h4>
          </div>

          {payrolls.filter(p => p.isActive).map((payroll, index, array) => {
            const progress = calculateVestingProgress(payroll.startTime, payroll.endTime);
            const isCompleted = progress >= 100;
            
            return (
              <div
                key={payroll.payrollId.toString()}
                style={{
                  padding: spacing.sm,
                  backgroundColor: colors.background,
                  borderRadius: '8px',
                  marginBottom: index === array.length - 1 ? 0 : spacing.sm,
                  border: `1px solid ${colors.border}`
                }}
              >
                {/* Vesting Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.xs
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted ? colors.success : colors.warning
                    }} />
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium,
                      color: colors.text.primary
                    }}>
                      Vesting #{payroll.payrollId.toString()}
                    </span>
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary
                  }}>
                    {formatAmount(payroll.amount)}
                  </div>
                </div>

                {/* Vesting Progress */}
                <div style={{
                  height: '4px',
                  backgroundColor: colors.border,
                  borderRadius: '2px',
                  marginBottom: spacing.sm,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: isCompleted ? colors.success : colors.primary,
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Vesting Details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: spacing.xs,
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Calendar size={12} />
                    <span>Start: {formatDate(payroll.startTime)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Calendar size={12} />
                    <span>End: {formatDate(payroll.endTime)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <Clock size={12} />
                    <span>Progress: {progress.toFixed(1)}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    {payroll.hasClaimed ? (
                      <>
                        <CheckCircle size={12} color={colors.success} />
                        <span style={{ color: colors.success }}>Claimed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} color={colors.warning} />
                        <span style={{ color: colors.warning }}>
                          {isCompleted ? 'Ready to claim' : 'Vesting in progress'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show total unclaimed amount */}
          {totalUnclaimedAmount > 0n && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: spacing.sm,
              paddingTop: spacing.sm,
              borderTop: `1px solid ${colors.border}`
            }}>
              <span style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary
              }}>
                Total Available to Claim
              </span>
              <span style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
                color: colors.primary
              }}>
                {formatAmount(totalUnclaimedAmount)}
              </span>
            </div>
          )}
        </div>
      )}
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm
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