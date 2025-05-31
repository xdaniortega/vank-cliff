'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { DollarSign, HandCoins, CreditCard, TrendingUp, Coins, ArrowDownLeft } from 'lucide-react';
import LoadingCard from './LoadingCard';
import TransactionTracker from './TransactionTracker';
import TransactionInterface from './TransactionInterface';
import { 
  fetchIndividualBalance,
  fetchCreditScore,
  IndividualBalance,
  CreditScore
} from '@/api/api_calls';
import { useWalletInfo } from '@/hooks/useWalletInfo';

interface IndividualDashboardProps {
  isLoading: boolean;
}

// Credit Score Half-Arch Component
const CreditScoreGauge = ({ score, maxScore }: { score: number; maxScore: number }) => {
  const percentage = (score / maxScore) * 100;
  const angle = (percentage / 100) * 180; // Half circle is 180 degrees
  
  // Determine color based on score
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 75) return '#22c55e'; // Green
    if (percentage >= 50) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const scoreColor = getScoreColor(score, maxScore);

  return (
    <div style={{
      position: 'relative',
      width: '200px',
      height: '110px',
      margin: '0 auto'
    }}>
      {/* Background arc */}
      <svg 
        width="200" 
        height="110" 
        viewBox="0 0 200 110"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke={colors.border}
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke={scoreColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251.3} 251.3`}
          style={{
            transition: 'stroke-dasharray 1s ease-in-out'
          }}
        />
      </svg>
      
      {/* Score text */}
      <div style={{
        position: 'absolute',
        top: '45px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: scoreColor,
          lineHeight: 1
        }}>
          {score}
        </div>
        <div style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.secondary,
          marginTop: '2px'
        }}>
          / {maxScore}
        </div>
      </div>
    </div>
  );
};

const UserBalanceCard = ({ 
  isLoading,
  balance
}: { 
  isLoading: boolean;
  balance: IndividualBalance | null;
}) => {
  if (isLoading) {
    return (
      <LoadingCard title="Loading Balance..." showSpinner={true}>
        <p>Fetching your current balance...</p>
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
              My Balance
            </h3>
          </div>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            Available funds
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
    </div>
  );
};

const FinancialActionsCard = ({ 
  isLoading,
  creditScore
}: { 
  isLoading: boolean;
  creditScore: CreditScore | null;
}) => {
  const [isRequestingMoney, setIsRequestingMoney] = useState(false);
  const [isRequestingLoan, setIsRequestingLoan] = useState(false);

  const handleRequestMoney = () => {
    setIsRequestingMoney(true);
    // Simulate API call
    setTimeout(() => {
      setIsRequestingMoney(false);
      alert('Money request sent successfully!');
    }, 2000);
  };

  const handleRequestLoan = () => {
    setIsRequestingLoan(true);
    // Simulate API call
    setTimeout(() => {
      setIsRequestingLoan(false);
      alert('Loan application submitted!');
    }, 2000);
  };

  if (isLoading) {
    return (
      <LoadingCard title="Loading Financial Tools..." showSpinner={true}>
        <p>Preparing your financial options...</p>
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
              <HandCoins size={18} color="white" strokeWidth={2.5} />
            </div>
            <h3 style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              Financial Actions
            </h3>
          </div>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            Manage your finances
          </p>
        </div>
      </div>

      {/* Credit Score Section */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginBottom: spacing.xl
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.md
        }}>
          <CreditCard size={16} color={colors.text.secondary} strokeWidth={2} />
          <h4 style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: 0
          }}>
            Credit Score
          </h4>
        </div>
        
        {creditScore && (
          <>
            <CreditScoreGauge score={creditScore.score} maxScore={creditScore.maxScore} />
            <div style={{
              textAlign: 'center',
              marginTop: spacing.sm
            }}>
              <span style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium
              }}>
                {creditScore.category}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        gap: spacing.md,
        flexDirection: 'column'
      }}>
        <button 
          onClick={handleRequestMoney}
          disabled={isRequestingMoney}
          style={{
            width: '100%',
            backgroundColor: isRequestingMoney ? colors.text.secondary : colors.primary,
            color: 'white',
            border: 'none',
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: '12px',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: isRequestingMoney ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease',
            boxShadow: isRequestingMoney ? 'none' : `0 2px 8px ${colors.primary}30`
          }}
        >
          {isRequestingMoney ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: `2px solid rgba(255, 255, 255, 0.3)`,
                borderTop: `2px solid white`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Processing...
            </>
          ) : (
            <>
              <HandCoins size={18} strokeWidth={2} />
              Request Money
            </>
          )}
        </button>

        <button 
          onClick={handleRequestLoan}
          disabled={isRequestingLoan}
          style={{
            width: '100%',
            backgroundColor: isRequestingLoan ? colors.text.secondary : colors.accent,
            color: 'white',
            border: 'none',
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: '12px',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: isRequestingLoan ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease',
            boxShadow: isRequestingLoan ? 'none' : `0 2px 8px ${colors.accent}30`
          }}
        >
          {isRequestingLoan ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: `2px solid rgba(255, 255, 255, 0.3)`,
                borderTop: `2px solid white`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={18} strokeWidth={2} />
              Ask for Loan
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function IndividualDashboard({ isLoading }: IndividualDashboardProps) {
  const [balance, setBalance] = useState<IndividualBalance | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Get wallet info for Blockscout API calls
  const { address: connectedAddress, chainId } = useWalletInfo();

  useEffect(() => {
    if (!isLoading) {
      setIsDataLoading(true);
      
      Promise.all([
        fetchIndividualBalance(connectedAddress || undefined, chainId || '1'),
        fetchCreditScore()
      ]).then(([balanceData, creditData]) => {
        setBalance(balanceData);
        setCreditScore(creditData);
        setIsDataLoading(false);
      }).catch((error) => {
        console.error('Error fetching individual dashboard data:', error);
        setIsDataLoading(false);
      });
    }
  }, [isLoading, connectedAddress, chainId]);

  const companyAddress = '0x742E8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf12';
  const employeeAddresses = [
    '0x123e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf34',
    '0x456e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf56',
    '0x789e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf78'
  ];

  return (
    <div>
      {/* First Row - Balance and Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: spacing.xl,
        marginBottom: spacing.xl
      }}>
        <UserBalanceCard 
          isLoading={isLoading || isDataLoading} 
          balance={balance}
        />
        <FinancialActionsCard 
          isLoading={isLoading || isDataLoading}
          creditScore={creditScore}
        />
      </div>

      {/* Second Row - Transaction Management */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: spacing.xl
      }}>
        <TransactionInterface
          companyAddress={companyAddress}
          employeeAddresses={employeeAddresses}
        />
        <TransactionTracker
          companyAddress={companyAddress}
          employeeAddresses={employeeAddresses}
        />
      </div>
    </div>
  );
}

// Add CSS for spinner animation
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