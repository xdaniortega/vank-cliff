'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Wallet,
  Building,
  Users,
  RefreshCw
} from 'lucide-react';
import { useNotification, useTransactionPopup } from '@blockscout/app-sdk';
import { useWalletInfo } from '@/hooks/useWalletInfo';

interface TransactionTrackerProps {
  companyAddress?: string;
  employeeAddresses?: string[];
  className?: string;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'success' | 'failed';
  type: 'company_to_employee' | 'employee_to_company';
  blockNumber?: number;
}

const TransactionTracker = ({ 
  companyAddress, 
  employeeAddresses = [],
  className 
}: TransactionTrackerProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { openTxToast } = useNotification();
  const { openPopup } = useTransactionPopup();
  const { address: connectedAddress, chainId, isConnected } = useWalletInfo();

  // Sample transactions - in a real app, you'd fetch from an API
  const [sampleTransactions] = useState<Transaction[]>([
    {
      hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      from: '0x742E8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf12',
      to: '0x123e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf34',
      value: '1.5',
      timestamp: Date.now() - 3600000,
      status: 'success',
      type: 'company_to_employee',
      blockNumber: 18500000
    },
    {
      hash: '0x2345678901bcdef02345678901bcdef02345678901bcdef02345678901bcdef0',
      from: '0x123e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf34',
      to: '0x742E8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf12',
      value: '0.1',
      timestamp: Date.now() - 7200000,
      status: 'success',
      type: 'employee_to_company',
      blockNumber: 18499500
    },
    {
      hash: '0x3456789012cdef013456789012cdef013456789012cdef013456789012cdef01',
      from: '0x742E8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf12',
      to: '0x456e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf56',
      value: '2.0',
      timestamp: Date.now() - 10800000,
      status: 'pending',
      type: 'company_to_employee'
    },
    {
      hash: '0x4567890123def0124567890123def0124567890123def0124567890123def012',
      from: '0x789e8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf78',
      to: '0x742E8d3d2CA4cb8e8Dcb8A3E2A3a8c5E9fB0Cf12',
      value: '0.05',
      timestamp: Date.now() - 14400000,
      status: 'failed',
      type: 'employee_to_company',
      blockNumber: 18498000
    },
  ]);

  useEffect(() => {
    // Load sample transactions
    setTransactions(sampleTransactions);
  }, [sampleTransactions]);

  const handleViewTransaction = async (hash: string) => {
    if (chainId) {
      await openTxToast(chainId, hash);
    }
  };

  const handleViewAllTransactions = () => {
    if (chainId) {
      openPopup({
        chainId,
        address: connectedAddress || undefined
      });
    }
  };

  const handleViewCompanyTransactions = () => {
    if (chainId && companyAddress) {
      openPopup({
        chainId,
        address: companyAddress
      });
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} color={colors.warning} />;
      case 'success':
        return <CheckCircle size={16} color={colors.success} />;
      case 'failed':
        return <XCircle size={16} color={colors.error} />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'success':
        return colors.success;
      case 'failed':
        return colors.error;
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    return type === 'company_to_employee' 
      ? <ArrowUpRight size={16} color={colors.error} />
      : <ArrowDownLeft size={16} color={colors.success} />;
  };

  return (
    <div 
      className={className}
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: spacing.lg,
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.background
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.sm
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
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
              <Wallet size={18} color="white" strokeWidth={2.5} />
            </div>
            <h3 style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              Transaction Tracker
            </h3>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            style={{
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              padding: spacing.xs,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            <RefreshCw 
              size={16} 
              color={colors.text.secondary}
              style={{
                animation: isLoading ? 'spin 1s linear infinite' : 'none'
              }}
            />
          </button>
        </div>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: spacing.sm,
          flexWrap: 'wrap'
        }}>
          <button
            onClick={handleViewAllTransactions}
            disabled={!isConnected}
            style={{
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              cursor: isConnected ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              opacity: isConnected ? 1 : 0.6
            }}
          >
            <Eye size={14} />
            View My Transactions
          </button>

          {companyAddress && (
            <button
              onClick={handleViewCompanyTransactions}
              style={{
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: 'transparent',
                color: colors.primary,
                border: `1px solid ${colors.primary}`,
                borderRadius: '6px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}
            >
              <Building size={14} />
              Company Transactions
            </button>
          )}
        </div>
      </div>

      {/* Transaction List */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {error && (
          <div style={{
            padding: spacing.lg,
            color: colors.error,
            backgroundColor: `${colors.error}10`,
            fontSize: typography.fontSize.sm
          }}>
            Error: {error}
          </div>
        )}

        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            gap: spacing.md
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: `2px solid ${colors.light}`,
              borderTop: `2px solid ${colors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{
              color: colors.text.secondary,
              fontSize: typography.fontSize.sm
            }}>
              Loading transactions...
            </span>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: spacing.xl,
            gap: spacing.md
          }}>
            <Users size={48} color={colors.text.tertiary} />
            <span style={{
              color: colors.text.secondary,
              fontSize: typography.fontSize.sm,
              textAlign: 'center'
            }}>
              No transactions found between company and employees
            </span>
          </div>
        ) : (
          <div style={{ padding: spacing.sm }}>
            {transactions.map((tx, index) => (
              <div
                key={tx.hash}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: spacing.md,
                  marginBottom: index < transactions.length - 1 ? spacing.xs : 0,
                  borderRadius: '8px',
                  border: `1px solid ${colors.border}`,
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => handleViewTransaction(tx.hash)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = colors.border;
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md,
                  flex: 1
                }}>
                  {/* Type icon */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: tx.type === 'company_to_employee' ? `${colors.error}10` : `${colors.success}10`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getTypeIcon(tx.type)}
                  </div>

                  {/* Transaction details */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginBottom: spacing.xs
                    }}>
                      <span style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.medium,
                        color: colors.text.primary
                      }}>
                        {tx.type === 'company_to_employee' ? 'Salary Payment' : 'Fee Payment'}
                      </span>
                      {getStatusIcon(tx.status)}
                    </div>
                    
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      marginBottom: spacing.xs
                    }}>
                      From: {formatAddress(tx.from)} → To: {formatAddress(tx.to)}
                    </div>

                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.tertiary
                    }}>
                      {formatTime(tx.timestamp)} • {formatAddress(tx.hash)}
                    </div>
                  </div>

                  {/* Value and status */}
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: tx.type === 'company_to_employee' ? colors.error : colors.success,
                      marginBottom: spacing.xs
                    }}>
                      {tx.type === 'company_to_employee' ? '-' : '+'}{tx.value} ETH
                    </div>
                    
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: getStatusColor(tx.status),
                      fontWeight: typography.fontWeight.medium,
                      textTransform: 'capitalize'
                    }}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {transactions.length > 0 && (
        <div style={{
          padding: spacing.md,
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
          textAlign: 'center'
        }}>
          <span style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary
          }}>
            Click any transaction to view details on Blockscout
          </span>
        </div>
      )}
    </div>
  );
};

export default TransactionTracker; 