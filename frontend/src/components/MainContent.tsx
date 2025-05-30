'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import LoadingCard from './LoadingCard';
import LoadingSpinner from './LoadingSpinner';

interface MainContentProps {
  activeSection: string;
  isMobile: boolean;
}

// Simulate data fetching for different sections
const useAsyncData = (sectionId: string) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      // Mock data based on section
      const mockData = {
        portfolio: { value: '$24,567.89', change: '+$1,234.56 (+5.3%)' },
        transactions: [],
        tradingData: { volume: '$156,789', pairs: 12 }
      };
      
      setData(mockData);
      setLoading(false);
    }, 1500); // 1.5 second delay to show loading

    return () => clearTimeout(timer);
  }, [sectionId]);

  return { loading, data };
};

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

// Company-specific widget
const CompanyDashboardWidget = ({ isLoading }: { isLoading: boolean }) => {
  if (isLoading) {
    return (
      <LoadingCard title="Loading Company Dashboard..." showSpinner={true}>
        <p>Setting up your corporate crypto management tools...</p>
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
          width: '40px',
          height: '40px',
          backgroundColor: colors.primary,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md
        }}>
          <span style={{ color: 'white', fontSize: '20px' }}>🏢</span>
        </div>
        <h3 style={{
          fontSize: typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
          color: colors.text.primary,
          margin: 0
        }}>
          Corporate Dashboard
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
            Treasury Balance
          </h4>
          <p style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary,
            margin: 0
          }}>
            $2,456,789
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
            Employee Wallets
          </h4>
          <p style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.primary,
            margin: 0
          }}>
            147
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
            Monthly Volume
          </h4>
          <p style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: 'white',
            margin: 0
          }}>
            $892K
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
          Manage Treasury
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
          Employee Payments
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
          Compliance Reports
        </button>
      </div>
    </div>
  );
};

// Individual user-specific widget
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
          width: '40px',
          height: '40px',
          backgroundColor: colors.secondary,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: spacing.md
        }}>
          <span style={{ color: 'white', fontSize: '20px' }}>👤</span>
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

// Utility function to safely check if user is a company
const isUserCompany = (user: any): boolean => {
  if (!user?.metadata || typeof user.metadata !== 'object') {
    return false;
  }
  
  const metadata = user.metadata as Record<string, any>;
  return metadata.UserIsCompany === true || metadata.UserIsCompany === 'true';
};

const sectionContent = {
  dashboard: {
    title: 'Dashboard',
    content: (isLoading: boolean) => {
      const { user } = useDynamicContext();
      
      // Check if user is a company based on metadata
      const userIsCompany = isUserCompany(user);
      
      return (
        <div>
          {/* Show different widgets based on user type */}
          {userIsCompany ? (
            <CompanyDashboardWidget isLoading={isLoading} />
          ) : (
            <IndividualDashboardWidget isLoading={isLoading} />
          )}
          
          {/* Common components shown to both user types */}
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
  },
  portfolio: {
    title: 'Portfolio',
    content: (isLoading: boolean) => (
      isLoading ? (
        <LoadingCard title="Loading Portfolio..." showSpinner={true}>
          <p>Analyzing your crypto holdings and performance...</p>
        </LoadingCard>
      ) : (
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
            Your Portfolio
          </h3>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.fontSize.base
          }}>
            Portfolio management features will be implemented here. Connect your wallet to view your holdings.
          </p>
        </div>
      )
    )
  },
  trading: {
    title: 'Trading',
    content: (isLoading: boolean) => (
      isLoading ? (
        <LoadingCard title="Loading Trading Interface..." showSpinner={true}>
          <p>Setting up advanced trading tools and market data...</p>
        </LoadingCard>
      ) : (
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
            Trading Interface
          </h3>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.fontSize.base
          }}>
            Advanced trading features and charts will be available here.
          </p>
        </div>
      )
    )
  }
};

export default function MainContent({ activeSection, isMobile }: MainContentProps) {
  const { loading } = useAsyncData(activeSection);
  const { user } = useDynamicContext();
  
  // Check if user is a company based on metadata
  const userIsCompany = isUserCompany(user);

  const section = sectionContent[activeSection as keyof typeof sectionContent] || {
    title: activeSection.charAt(0).toUpperCase() + activeSection.slice(1),
    content: (isLoading: boolean) => (
      isLoading ? (
        <LoadingCard title={`Loading ${activeSection}...`} showSpinner={true}>
          <p>Preparing your {activeSection} data...</p>
        </LoadingCard>
      ) : (
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
            {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
          </h3>
          <p style={{
            color: colors.text.secondary,
            fontSize: typography.fontSize.base
          }}>
            This section is coming soon. Stay tuned for updates!
          </p>
        </div>
      )
    )
  };

  return (
    <main style={{
      marginLeft: isMobile ? '0' : '280px',
      marginTop: '64px',
      minHeight: 'calc(100vh - 64px)',
      backgroundColor: colors.background,
      overflowY: 'auto'
    }}>
      <div style={{
        padding: spacing.xl,
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xl
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md
          }}>
            <h1 style={{
              fontFamily: typography.fontFamily,
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0
            }}>
              {section.title}
            </h1>
            {loading && <LoadingSpinner size="medium" />}
          </div>
          
          {/* User type badge */}
          {user && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: userIsCompany ? colors.primary : colors.secondary,
              color: 'white',
              padding: `${spacing.xs} ${spacing.sm}`,
              borderRadius: '16px',
              fontSize: typography.fontSize.xs,
              fontWeight: typography.fontWeight.medium
            }}>
              <span style={{ marginRight: spacing.xs }}>
                {userIsCompany ? '🏢' : '👤'}
              </span>
              {userIsCompany ? 'Company Account' : 'Personal Account'}
            </div>
          )}
        </div>
        
        {section.content(loading)}
        
        {/* Extra content to demonstrate scrolling - only show when not loading */}
        {!loading && (
          <div style={{ height: '50vh', marginTop: spacing.xl }}>
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
                Additional Content
              </h3>
              <p style={{
                color: colors.text.secondary,
                fontSize: typography.fontSize.base,
                lineHeight: 1.6
              }}>
                This is additional content to demonstrate the scrollable nature of the main content area. 
                The sidebar and app bar remain fixed while this content scrolls independently.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 