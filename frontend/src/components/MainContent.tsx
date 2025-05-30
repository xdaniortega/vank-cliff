'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isUserCompany } from '@/utils/userHelpers';
import LoadingCard from './LoadingCard';
import LoadingSpinner from './LoadingSpinner';
import IndividualDashboard from './IndividualDashboard';
import CompanyDashboard from './CompanyDashboard';
import { Building2 } from 'lucide-react';

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

export default function MainContent({ activeSection, isMobile }: MainContentProps) {
  // Always call hooks first - this must be consistent across renders
  const { loading } = useAsyncData(activeSection);
  const dynamicContext = useDynamicContext();
  const { user } = dynamicContext;
  
  // Check if user is a company based on metadata
  const userIsCompany = isUserCompany(user);

  // Define content after all hooks are called
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            {/* Show different dashboards based on user type */}
            {userIsCompany ? (
              <CompanyDashboard isLoading={loading} />
            ) : (
              <IndividualDashboard isLoading={loading} />
            )}
          </div>
        );
      
      case 'company':
        return loading ? (
          <LoadingCard title={userIsCompany ? "Loading Employees..." : "Loading Company..."} showSpinner={true}>
            <p>{userIsCompany ? "Fetching employee data and management tools..." : "Setting up company management features..."}</p>
          </LoadingCard>
        ) : (
          <div style={{
            backgroundColor: 'white',
            padding: spacing.xl,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
            boxShadow: `0 2px 8px ${colors.shadow}`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: spacing.lg
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: colors.primary,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: spacing.md
              }}>
                <Building2 
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
                {userIsCompany ? 'Employee Management' : 'Company Features'}
              </h3>
            </div>
            
            {userIsCompany ? (
              <div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                      Total Employees
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
                      Active Wallets
                    </h4>
                    <p style={{
                      fontSize: typography.fontSize.xl,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.primary,
                      margin: 0
                    }}>
                      142
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
                      Monthly Payroll
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
                    Add Employee
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
                    Process Payroll
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
            ) : (
              <div>
                <p style={{
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.base,
                  marginBottom: spacing.lg
                }}>
                  Company management features and tools will be available here.
                </p>
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
                    Upgrade to Company
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return loading ? (
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
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Dashboard';
      case 'company': return userIsCompany ? 'Employees' : 'Company';
      default: return activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
    }
  };

  return (
    <main style={{
      marginLeft: isMobile ? '0' : '240px',
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
              {getSectionTitle()}
            </h1>
            {loading && <LoadingSpinner size="medium" />}
          </div>
          
          
          
        </div>
        
        {renderSectionContent()}
        
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