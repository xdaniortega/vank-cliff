import { useState, useMemo } from 'react';
import { colors, typography, spacing } from '@/theme/colors';
import { DollarSign, Clock, Users, ChevronDown, ChevronUp, Award, Calendar, Info, User, Hash } from 'lucide-react';
import { useWalletInfo } from '@/hooks/useWalletInfo';
import { useReadContract } from 'wagmi';
import { payrollContractABI } from '@/abi/payrollContractABI';

interface PayrollPositionCardProps {
  payrollId: bigint;
  positionIndex: bigint;
  teamName: string;
  teamColor: string;
}

interface BeneficiaryInfo {
  beneficiary: `0x${string}`;
  amount: bigint | undefined;
  unlockTime: bigint | undefined;
  hasClaimed: boolean | undefined;
}

const PayrollPositionCard = ({
  payrollId,
  positionIndex,
  teamName,
  teamColor
}: PayrollPositionCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { address: companyAddress } = useWalletInfo();

  const { data: positionInfo, isLoading: isLoadingPositionInfo } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
    abi: payrollContractABI,
    functionName: 'getPositionInfo',
    args: [payrollId, positionIndex],
    query: {
      enabled: !!payrollId && positionIndex !== undefined
    }
  });

  const { data: payrollInfoData, isLoading: isLoadingPayrollInfo } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
    abi: payrollContractABI,
    functionName: 'getPayrollInfo',
    args: [payrollId],
    query: {
      enabled: !!payrollId
    }
  });

  const { data: beneficiariesData, isLoading: isLoadingBeneficiaries } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
    abi: payrollContractABI,
    functionName: 'getPayrollBeneficiaries',
    args: [payrollId],
    query: {
      enabled: !!payrollId
    }
  });

  // Memoize beneficiary queries to prevent infinite updates
  const beneficiaryQueries = useMemo(() => {
    if (!beneficiariesData || !payrollId) return [];
    
    return (beneficiariesData as `0x${string}`[]).map(beneficiary => {
      const { data: amountData } = useReadContract({
        address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
        abi: payrollContractABI,
        functionName: 'payrollAmounts',
        args: [payrollId, beneficiary],
        query: {
          enabled: !!payrollId && !!beneficiary
        }
      });

      const { data: unlockTimeData } = useReadContract({
        address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
        abi: payrollContractABI,
        functionName: 'payrollUnlockTimes',
        args: [payrollId, beneficiary],
        query: {
          enabled: !!payrollId && !!beneficiary
        }
      });

      const { data: hasClaimedData } = useReadContract({
        address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
        abi: payrollContractABI,
        functionName: 'payrollHasClaimed',
        args: [payrollId, beneficiary],
        query: {
          enabled: !!payrollId && !!beneficiary
        }
      });

      return {
        beneficiary,
        amount: amountData as bigint | undefined,
        unlockTime: unlockTimeData as bigint | undefined,
        hasClaimed: hasClaimedData as boolean | undefined
      };
    });
  }, [beneficiariesData, payrollId]);

  if (isLoadingPositionInfo || isLoadingPayrollInfo || isLoadingBeneficiaries) {
    return (
      <div style={{
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: colors.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${colors.border}`,
              borderTop: `2px solid ${colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
          <div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              marginBottom: spacing.xs
            }}>
              Loading payroll information...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!positionInfo || !payrollInfoData || !beneficiariesData) {
    return (
      <div style={{
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary
        }}>
          No payroll information available
        </div>
      </div>
    );
  }

  const [
    pool,
    _positionId,
    totalAmount,
    availableAmount,
    totalRewardsData,
    claimedRewardsData,
    isActive
  ] = positionInfo as [
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean
  ];

  const [
    _positionIndex,
    _amount,
    startTime,
    endTime,
    claimedAmount,
    _isActive
  ] = payrollInfoData as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean
  ];

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const calculateProgress = () => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now <= startTime) return 0;
    if (now >= endTime) return 100;
    return Number((now - startTime) * 100n / (endTime - startTime));
  };

  const progress = calculateProgress();

  return (
    <div style={{
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: `${teamColor}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Calendar size={20} color={teamColor} />
          </div>
          <div>
            <div style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing.xs
            }}>
              {teamName}
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              <Hash size={14} />
              Vesting Schedule #{payrollId.toString()}
            </div>
          </div>
        </div>
        <div style={{
          fontSize: typography.fontSize.sm,
          color: isActive ? colors.success : colors.text.secondary,
          fontWeight: typography.fontWeight.medium,
          backgroundColor: isActive ? `${colors.success}15` : colors.light,
          padding: `${spacing.xs} ${spacing.sm}`,
          borderRadius: '6px'
        }}>
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>

      {/* Vesting Schedule */}
      <div style={{
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.light,
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          marginBottom: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs
        }}>
          <Clock size={16} />
          Vesting Schedule Details
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md,
          marginBottom: spacing.md
        }}>
          <div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              marginBottom: spacing.xs
            }}>
              Schedule ID
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary,
              fontFamily: 'monospace'
            }}>
              #{payrollId.toString()}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              marginBottom: spacing.xs
            }}>
              Start Date
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.primary
            }}>
              {formatDate(startTime)}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              marginBottom: spacing.xs
            }}>
              End Date
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.primary
            }}>
              {formatDate(endTime)}
            </div>
          </div>
        </div>
        <div style={{
          marginTop: spacing.sm,
          height: '4px',
          backgroundColor: colors.border,
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: colors.primary,
            transition: 'width 0.3s ease'
          }}></div>
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
          textAlign: 'right',
          marginTop: spacing.xs
        }}>
          {progress}% vested
        </div>
      </div>

      {/* Beneficiaries Information */}
      <div style={{
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.light,
        borderRadius: '8px'
      }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          marginBottom: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs
        }}>
          <Users size={16} />
          Beneficiaries ({beneficiaryQueries.length})
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md
        }}>
          {beneficiaryQueries.map(({ beneficiary, amount, unlockTime, hasClaimed }) => (
            <div
              key={beneficiary}
              style={{
                padding: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                marginBottom: spacing.sm
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: `${colors.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={16} color={colors.primary} />
                </div>
                <div style={{
                  fontSize: typography.fontSize.sm,
                  fontFamily: 'monospace',
                  color: colors.text.primary,
                  wordBreak: 'break-all'
                }}>
                  {beneficiary}
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: spacing.sm
              }}>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs
                  }}>
                    Amount
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary
                  }}>
                    {amount ? (Number(amount) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} DAI
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs
                  }}>
                    Unlock Time
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.text.primary
                  }}>
                    {unlockTime && unlockTime > 0n ? formatDate(unlockTime) : 'Not unlocked yet'}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    marginBottom: spacing.xs
                  }}>
                    Status
                  </div>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    color: hasClaimed ? colors.success : colors.text.secondary,
                    fontWeight: typography.fontWeight.medium
                  }}>
                    {hasClaimed ? 'Claimed' : 'Not claimed'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position Information */}
      <div style={{
        marginBottom: spacing.lg,
        padding: spacing.md,
        backgroundColor: colors.light,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`
      }}>
        <div style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          marginBottom: spacing.sm,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs
        }}>
          <Info size={16} />
          Position Information
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing.md
        }}>
          <div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              marginBottom: spacing.xs
            }}>
              Position Index
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary
            }}>
              #{positionIndex.toString()}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              marginBottom: spacing.xs
            }}>
              Pool Address
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontFamily: 'monospace',
              color: colors.text.primary,
              wordBreak: 'break-all'
            }}>
              {pool}
            </div>
          </div>
          <div>
            <div style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.secondary,
              marginBottom: spacing.xs
            }}>
              Total Amount
            </div>
            <div style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: colors.text.primary
            }}>
              {(Number(totalAmount) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} DAI
            </div>
          </div>
        </div>
      </div>

      {/* Rewards Information */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: spacing.md
      }}>
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.light,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.xs
          }}>
            Total Rewards
          </div>
          <div style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            {(Number(totalRewardsData) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} DAI
          </div>
        </div>
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.light,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.xs
          }}>
            Claimed Rewards
          </div>
          <div style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary
          }}>
            {(Number(claimedRewardsData) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} DAI
          </div>
        </div>
        <div style={{
          padding: spacing.md,
          backgroundColor: colors.light,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`
        }}>
          <div style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            marginBottom: spacing.xs
          }}>
            Available Rewards
          </div>
          <div style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.primary
          }}>
            {(Number(totalRewardsData - claimedRewardsData) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })} DAI
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayrollPositionCard; 