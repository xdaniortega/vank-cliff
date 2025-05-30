'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { User } from 'lucide-react';
import LoadingCard from './LoadingCard';

interface IndividualDashboardProps {
  isLoading: boolean;
}

const PortfolioCard = ({ title, isLoading }: { title: string; isLoading: boolean }) => {
  if (isLoading) {
    return (
      <LoadingCard title={`Loading ${title}...`} showSpinner={true}>
        <p>Fetching your latest portfolio data...</p>
      </LoadingCard>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: spacing.xl,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 2px 8px ${colors.shadow}`
    }}>
      <h3 style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.md
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        color: colors.primary,
        margin: '0 0 8px 0'
      }}>
        $24,567.89
      </p>
      <p style={{
        fontSize: typography.fontSize.sm,
        color: colors.text.secondary,
        margin: 0
      }}>
        +$1,234.56 (+5.3%) today
      </p>
    </div>
  );
};

const QuickActionsCard = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) {
    return (
      <LoadingCard title="Loading Actions..." showSpinner={true}>
        <p>Preparing your trading options...</p>
      </LoadingCard>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: spacing.xl,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 2px 8px ${colors.shadow}`
    }}>
      <h3 style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.lg
      }}>
        Quick Actions
      </h3>
      <div style={{
        display: 'flex',
        gap: spacing.md,
        flexWrap: 'wrap'
      }}>
        <button style={{
          backgroundColor: colors.primary,
          color: 'white',
          border: 'none',
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: '8px',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          cursor: 'pointer'
        }}>
          Buy Crypto
        </button>
        <button style={{
          backgroundColor: colors.secondary,
          color: 'white',
          border: 'none',
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: '8px',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          cursor: 'pointer'
        }}>
          Sell Crypto
        </button>
      </div>
    </div>
  );
};

const TransactionsCard = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) {
    return (
      <LoadingCard title="Loading Transactions..." showSpinner={true}>
        <p>Fetching your recent transaction history...</p>
      </LoadingCard>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: spacing.xl,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 2px 8px ${colors.shadow}`
    }}>
      <h3 style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.lg
      }}>
        Recent Transactions
      </h3>
      <p style={{
        color: colors.text.secondary,
        fontSize: typography.fontSize.base
      }}>
        Your recent transactions will appear here once you connect your wallet.
      </p>
    </div>
  );
};

const IndividualDashboardWidget = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) {
    return (
      <LoadingCard title="Loading Personal Dashboard..." showSpinner={true}>
        <p>Setting up your personal crypto portfolio...</p>
      </LoadingCard>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      padding: spacing.xl,
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      boxShadow: `0 2px 8px ${colors.shadow}`,
      marginBottom: spacing.lg
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: spacing.lg
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          backgroundColor: colors.secondary,
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md
        }}>
          <User 
            size={24} 
            color="white"
            strokeWidth={2}
          />
        </div>
        <h3 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          margin: 0
        }}>
          Personal Portfolio
        </h3>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: spacing.md,
        marginBottom: spacing.lg
      }}>
        <div style={{
          backgroundColor: colors.light,
          padding: spacing.md,
          borderRadius: '8px'
        }}>
          <h4 style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
            margin: '0 0 8px 0'
          }}>
            Total Balance
          </h4>
          <p style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary,
            margin: 0
          }}>
            $24,567.89
          </p>
        </div>
        
        <div style={{
          backgroundColor: colors.mint,
          padding: spacing.md,
          borderRadius: '8px'
        }}>
          <h4 style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: colors.text.secondary,
            margin: '0 0 8px 0'
          }}>
            24h Change
          </h4>
          <p style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: '#22c55e',
            margin: 0
          }}>
            +5.2%
          </p>
        </div>
        
        <div style={{
          backgroundColor: colors.accent,
          padding: spacing.md,
          borderRadius: '8px'
        }}>
          <h4 style={{
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            color: 'white',
            margin: '0 0 8px 0'
          }}>
            Holdings
          </h4>
          <p style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: 'white',
            margin: 0
          }}>
            12 Assets
          </p>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: spacing.md,
        flexWrap: 'wrap'
      }}>
        <button style={{
          backgroundColor: colors.primary,
          color: 'white',
          border: 'none',
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: '8px',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          cursor: 'pointer'
        }}>
          Buy Crypto
        </button>
        <button style={{
          backgroundColor: colors.secondary,
          color: 'white',
          border: 'none',
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: '8px',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          cursor: 'pointer'
        }}>
          Send/Receive
        </button>
        <button style={{
          backgroundColor: 'transparent',
          color: colors.primary,
          border: `2px solid ${colors.primary}`,
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: '8px',
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          cursor: 'pointer'
        }}>
          View Reports
        </button>
      </div>
    </div>
  );
};

export default function IndividualDashboard({ isLoading }: IndividualDashboardProps) {
  return (
    <div>
      <IndividualDashboardWidget isLoading={isLoading} />
      
      {/* Common components */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: spacing.lg,
        marginBottom: spacing.xl
      }}>
        <PortfolioCard title="Portfolio Value" isLoading={isLoading} />
        <QuickActionsCard isLoading={isLoading} />
      </div>
      <TransactionsCard isLoading={isLoading} />
    </div>
  );
} 