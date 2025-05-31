'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState } from 'react';
import { Clock, ExternalLink, Filter, ArrowUpRight } from 'lucide-react';
import { useTransactionPopup, TransactionPopupProvider } from '@blockscout/app-sdk';
import { useWalletInfo } from '@/hooks/useWalletInfo';

interface BlockscoutTransactionHistoryProps {
  companyAddress?: string;
  employeeAddresses?: string[];
  title?: string;
  showAllTransactions?: boolean;
  userRole?: 'individual' | 'company';
  userAddress?: string;
}

const TransactionHistoryContent = ({ 
  companyAddress, 
  employeeAddresses, 
  title = "Transaction History",
  showAllTransactions = false,
  userRole = 'individual',
  userAddress
}: BlockscoutTransactionHistoryProps) => {
  const { openPopup } = useTransactionPopup();
  const { chainId } = useWalletInfo();
  
  // Set initial filter based on user role
  const getInitialFilter = () => {
    if (userRole === 'individual') return 'user';
    return 'company';
  };
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'company' | 'employees' | 'user'>(getInitialFilter());

  const handleViewTransactions = (addressFilter?: string) => {
    // For individual users, always use their own address
    const targetAddress = userRole === 'individual' ? userAddress : addressFilter;
    
    openPopup({
      chainId: chainId || '1', // Default to Ethereum mainnet
      address: targetAddress // undefined shows all transactions (only for company)
    });
  };

  const getFilterLabel = (filter: 'all' | 'company' | 'employees' | 'user') => {
    switch (filter) {
      case 'all': return 'All Network';
      case 'company': return 'Company Wallet';
      case 'employees': return 'Employee Wallets';
      case 'user': return 'My Transactions';
      default: return 'All Transactions';
    }
  };

  const getFilterAddress = (filter: 'all' | 'company' | 'employees' | 'user') => {
    switch (filter) {
      case 'company': return companyAddress;
      case 'employees': return undefined; // For now, we'll show all - could enhance to show first employee
      case 'user': return userAddress;
      case 'all': 
      default: return undefined;
    }
  };

  // Get available filters based on user role
  const getAvailableFilters = () => {
    if (userRole === 'individual') {
      return ['user']; // Individual users can only see their own transactions
    } else {
      // Company users can see company, employee, or all network transactions
      const filters = ['company'];
      if (employeeAddresses && employeeAddresses.length > 0) {
        filters.push('employees');
      }
      filters.push('all');
      return filters;
    }
  };

  const availableFilters = getAvailableFilters();

  return (
    <div 
      className="main-block-gradient-reverse"
      style={{
        backgroundColor: 'white',
        padding: spacing.xl,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 4px 12px ${colors.shadow}`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '120px',
        height: '120px',
        background: `linear-gradient(135deg, ${colors.secondary}15, ${colors.primary}10)`,
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
              backgroundColor: colors.secondary,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={18} color="white" strokeWidth={2.5} />
            </div>
            <h3 style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              {title}
            </h3>
          </div>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            View real transaction history via Blockscout
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
          <ExternalLink size={12} color={colors.text.secondary} strokeWidth={2} />
          <span style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.medium
          }}>
            Blockscout
          </span>
        </div>
      </div>

      {/* Filter Options */}
      {availableFilters.length > 0 && (
        <div style={{
          position: 'relative',
          zIndex: 1,
          marginBottom: spacing.md
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md
          }}>
            <Filter size={16} color={colors.text.secondary} strokeWidth={2} />
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              {userRole === 'individual' ? 'View Transactions' : 'Quick Filters'}
            </h4>
          </div>
          
          <div style={{
            display: 'flex',
            gap: spacing.md,
            flexWrap: 'wrap'
          }}>
            {availableFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter as 'all' | 'company' | 'employees' | 'user');
                  handleViewTransactions(getFilterAddress(filter as 'all' | 'company' | 'employees' | 'user'));
                }}
                style={{
                  backgroundColor: activeFilter === filter ? colors.primary : 'white',
                  color: activeFilter === filter ? 'white' : colors.text.primary,
                  border: `2px solid ${activeFilter === filter ? colors.primary : colors.border}`,
                  padding: `${spacing.md} ${spacing.lg}`,
                  borderRadius: '12px',
                  fontSize: typography.fontSize.base,
                  fontWeight: typography.fontWeight.semibold,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  transition: 'all 0.2s ease',
                  boxShadow: activeFilter === filter ? `0 4px 12px ${colors.primary}30` : '0 2px 8px rgba(0,0,0,0.05)',
                  minHeight: '48px',
                  flex: userRole === 'individual' ? '1' : 'none',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  if (activeFilter !== filter) {
                    e.currentTarget.style.borderColor = colors.primary;
                    e.currentTarget.style.color = colors.primary;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeFilter !== filter) {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.color = colors.text.primary;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                  }
                }}
              >
                <Clock size={16} strokeWidth={2} />
                {getFilterLabel(filter as 'all' | 'company' | 'employees' | 'user')}
                <ExternalLink size={14} strokeWidth={2} />
              </button>
            ))}
          </div>
          
          <p style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            textAlign: 'center',
            margin: `${spacing.sm} 0 0 0`
          }}>
            {userRole === 'individual' 
              ? 'Click to view your personal transaction history via Blockscout' 
              : 'Click any option to view transactions via Blockscout explorer'
            }
          </p>
        </div>
      )}
    </div>
  );
};

// Main component with provider wrapper
const BlockscoutTransactionHistory = (props: BlockscoutTransactionHistoryProps) => {
  return (
    <TransactionPopupProvider>
      <TransactionHistoryContent {...props} />
    </TransactionPopupProvider>
  );
};

export default BlockscoutTransactionHistory; 