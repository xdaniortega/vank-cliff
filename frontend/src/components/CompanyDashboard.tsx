'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { DollarSign, Zap, TrendingUp, X, User, Wallet } from 'lucide-react';
import LoadingCard from './LoadingCard';
import { 
  fetchTreasuryBalance, 
  fetchTeamsAndEmployees,
  processPayrollPayments,
  Employee,
  Team,
  TeamsAndEmployeesData
} from '@/api/api_calls';

interface CompanyDashboardProps {
  isLoading: boolean;
}

const EmployeesPopup = ({ 
  isOpen, 
  onClose, 
  onPaymentComplete,
  currentBalance 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onPaymentComplete: (totalPaid: number) => void;
  currentBalance: number;
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPayingAll, setIsPayingAll] = useState(false);

  // Block/unblock body scrolling when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      // Block scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scrolling
      document.body.style.overflow = 'unset';
    }

    // Cleanup: restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch employees when popup opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchTeamsAndEmployees()
        .then((data) => {
          // Flatten all employees from all teams
          const allEmployees: Employee[] = [];
          data.teams.forEach(team => {
            allEmployees.push(...team.members);
          });
          setEmployees(allEmployees);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching employees:', error);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  const totalToPay = employees.reduce((sum, employee) => sum + employee.salary, 0);
  const hasInsufficientFunds = currentBalance < totalToPay;

  const handlePayAll = async () => {
    if (hasInsufficientFunds) return; // Prevent payment if insufficient funds
    
    setIsPayingAll(true);
    
    try {
      const result = await processPayrollPayments(employees, totalToPay);
      if (result.success) {
        onPaymentComplete(totalToPay);
        onClose();
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
    } finally {
      setIsPayingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.lg
      }}>
        {/* Modal */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15)`
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.xl,
            paddingBottom: spacing.md,
            borderBottom: `1px solid ${colors.border}`,
            flexShrink: 0
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
                <User size={18} color="white" strokeWidth={2.5} />
              </div>
              <h2 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0
              }}>
                Employees
              </h2>
            </div>
            
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: spacing.xs,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} color={colors.text.secondary} strokeWidth={2} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: spacing.xl,
            paddingTop: spacing.lg
          }}>
            {isLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `${spacing.xl} 0`,
                gap: spacing.md,
                minHeight: '200px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  border: `3px solid ${colors.light}`,
                  borderTop: `3px solid ${colors.primary}`,
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{
                  fontSize: typography.fontSize.base,
                  color: colors.text.secondary,
                  margin: 0
                }}>
                  Loading employees...
                </p>
              </div>
            ) : (
              <>
                {/* Total to Pay */}
                <div style={{
                  backgroundColor: colors.mint,
                  padding: spacing.md,
                  borderRadius: '12px',
                  marginBottom: spacing.lg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary
                  }}>
                    Total to Pay:
                  </span>
                  <span style={{
                    fontSize: typography.fontSize.xl,
                    fontWeight: typography.fontWeight.bold,
                    color: colors.primary
                  }}>
                    ${totalToPay.toLocaleString()}
                  </span>
                </div>

                {/* Employee List */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.md
                }}>
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: spacing.md,
                        backgroundColor: colors.surface,
                        borderRadius: '12px',
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        flex: 1
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: colors.primary,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <User size={16} color="white" strokeWidth={2} />
                        </div>
                        <div>
                          <h4 style={{
                            fontSize: typography.fontSize.sm,
                            fontWeight: typography.fontWeight.semibold,
                            color: colors.text.primary,
                            margin: '0 0 4px 0'
                          }}>
                            {employee.name}
                          </h4>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs
                          }}>
                            <Wallet size={12} color={colors.text.secondary} strokeWidth={1.5} />
                            <span style={{
                              fontSize: typography.fontSize.xs,
                              color: colors.text.secondary,
                              fontFamily: 'monospace'
                            }}>
                              {employee.walletAddress.slice(0, 6)}...{employee.walletAddress.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <span style={{
                          fontSize: typography.fontSize.base,
                          fontWeight: typography.fontWeight.bold,
                          color: colors.text.primary
                        }}>
                          ${employee.salary.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!isLoading && (
            <div style={{
              padding: spacing.xl,
              paddingTop: spacing.md,
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.md,
              flexShrink: 0,
              backgroundColor: 'white',
              borderRadius: '0 0 16px 16px'
            }}>
              {/* Insufficient funds warning */}
              {hasInsufficientFunds && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: spacing.sm,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs
                }}>
                  <span style={{
                    fontSize: typography.fontSize.sm,
                    color: '#dc2626',
                    fontWeight: typography.fontWeight.medium
                  }}>
                    ⚠️ Insufficient funds: Company balance (${currentBalance.toFixed(2)}) is less than total payroll (${totalToPay.toLocaleString()})
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: spacing.md,
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={onClose}
                  disabled={isPayingAll}
                  style={{
                    backgroundColor: 'transparent',
                    color: colors.text.secondary,
                    border: `1px solid ${colors.border}`,
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: '8px',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    cursor: isPayingAll ? 'not-allowed' : 'pointer',
                    opacity: isPayingAll ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                
                <button
                  onClick={handlePayAll}
                  disabled={isPayingAll || hasInsufficientFunds}
                  style={{
                    backgroundColor: isPayingAll || hasInsufficientFunds ? '#9ca3af' : colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderRadius: '8px',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: isPayingAll || hasInsufficientFunds ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    minWidth: '120px',
                    justifyContent: 'center',
                    opacity: hasInsufficientFunds ? 0.6 : 1
                  }}
                >
                  {isPayingAll ? (
                    <>
                      <div style={{
                        width: '14px',
                        height: '14px',
                        border: `2px solid rgba(255, 255, 255, 0.3)`,
                        borderTop: `2px solid white`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign size={14} strokeWidth={2} />
                      Pay All
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const CurrencyAmountCard = ({ 
  isLoading, 
  currentAmount, 
  onAmountUpdate,
  teamsData
}: { 
  isLoading: boolean;
  currentAmount: number;
  onAmountUpdate: (newAmount: number) => void;
  teamsData?: TeamsAndEmployeesData;
}) => {
  const [displayAmount, setDisplayAmount] = useState<string>('Loading...');
  const [isAmountLoading, setIsAmountLoading] = useState(true);

  useEffect(() => {
    if (currentAmount !== 0) {
      setDisplayAmount(`$${currentAmount.toFixed(2)}`);
      setIsAmountLoading(false);
    } else {
      // Initial load - fetch treasury balance
      fetchTreasuryBalance()
        .then((balanceData) => {
          setDisplayAmount(`$${balanceData.amount.toFixed(2)}`);
          setIsAmountLoading(false);
          onAmountUpdate(balanceData.amount);
        })
        .catch((error) => {
          console.error('Error fetching treasury balance:', error);
          setDisplayAmount('Error loading balance');
          setIsAmountLoading(false);
        });
    }
  }, [currentAmount, onAmountUpdate]);

  if (isLoading) {
    return (
      <LoadingCard title="Loading Currency..." showSpinner={true}>
        <p>Fetching current treasury balance...</p>
      </LoadingCard>
    );
  }

  // Use teams data from props, or fallback to empty array
  const teamBudgets = teamsData?.teams || [];
  const totalTeamCosts = teamsData?.totalTeamCosts || 0;

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
        zIndex: 1,
        marginBottom: spacing.xl
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
              {displayAmount}
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

      {/* Teams Budget Section */}
      {!isAmountLoading && teamBudgets.length > 0 && (
        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          {/* Section Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.md
          }}>
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              Team Budgets
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <span style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.medium
              }}>
                Total: ${totalTeamCosts.toLocaleString()}
              </span>
              <span style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.secondary,
                fontWeight: typography.fontWeight.medium
              }}>
                {teamBudgets.length} teams
              </span>
            </div>
          </div>

          {/* Horizontally Scrollable Team Cards */}
          <div style={{
            display: 'flex',
            gap: spacing.md,
            overflowX: 'auto',
            paddingBottom: spacing.sm,
            scrollbarWidth: 'thin',
            scrollbarColor: `${colors.border} transparent`
          }}>
            {teamBudgets.map((team) => {
              return (
                <div
                  key={team.id}
                  style={{
                    minWidth: '140px',
                    backgroundColor: colors.surface,
                    padding: spacing.md,
                    borderRadius: '12px',
                    border: `1px solid ${colors.border}`,
                    flexShrink: 0
                  }}
                >
                  {/* Team Name and Color Indicator */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    marginBottom: spacing.sm
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: team.color,
                      borderRadius: '50%'
                    }}></div>
                    <h5 style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.text.primary,
                      margin: 0
                    }}>
                      {team.name}
                    </h5>
                  </div>

                  {/* Budget Amount */}
                  <div>
                    <p style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      margin: '0 0 2px 0',
                      lineHeight: 1
                    }}>
                      ${team.budget.toLocaleString()}
                    </p>
                    <p style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      margin: 0
                    }}>
                      Team Cost
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom scrollbar styles */}
          <style jsx>{`
            div::-webkit-scrollbar {
              height: 6px;
            }
            div::-webkit-scrollbar-track {
              background: ${colors.light};
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb {
              background: ${colors.border};
              border-radius: 3px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: ${colors.text.secondary};
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

const ActionsCard = ({ 
  isLoading, 
  onPaymentComplete,
  currentBalance 
}: { 
  isLoading: boolean;
  onPaymentComplete: (amount: number) => void;
  currentBalance: number;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEmployeesPopup, setShowEmployeesPopup] = useState(false);

  const handlePaySalaries = async () => {
    setShowEmployeesPopup(true);
  };

  const handlePaymentComplete = (totalPaid: number) => {
    onPaymentComplete(totalPaid);
  };

  if (isLoading) {
    return (
      <LoadingCard title="Loading Actions..." showSpinner={true}>
        <p>Preparing company actions...</p>
      </LoadingCard>
    );
  }

  return (
    <>
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

      {/* Employees Popup */}
      <EmployeesPopup
        isOpen={showEmployeesPopup}
        onClose={() => setShowEmployeesPopup(false)}
        onPaymentComplete={handlePaymentComplete}
        currentBalance={currentBalance}
      />
    </>
  );
};

export default function CompanyDashboard({ isLoading }: CompanyDashboardProps) {
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [teamsData, setTeamsData] = useState<TeamsAndEmployeesData | undefined>();

  // Fetch teams and employees data
  useEffect(() => {
    if (!isLoading) {
      fetchTeamsAndEmployees()
        .then((data) => {
          setTeamsData(data);
        })
        .catch((error) => {
          console.error('Error fetching teams and employees:', error);
        });
    }
  }, [isLoading]);

  const handleAmountUpdate = (newAmount: number) => {
    setTreasuryBalance(newAmount);
  };

  const handlePaymentComplete = (totalPaid: number) => {
    // Deduct the payment from treasury balance
    setTreasuryBalance(prev => prev - totalPaid);
  };

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: spacing.xl,
        marginBottom: spacing.xl
      }}>
        <CurrencyAmountCard 
          isLoading={isLoading} 
          currentAmount={treasuryBalance}
          onAmountUpdate={handleAmountUpdate}
          teamsData={teamsData}
        />
        <ActionsCard 
          isLoading={isLoading}
          onPaymentComplete={handlePaymentComplete}
          currentBalance={treasuryBalance}
        />
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