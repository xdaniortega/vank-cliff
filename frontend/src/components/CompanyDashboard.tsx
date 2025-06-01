'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Zap, TrendingUp, X, User, Wallet, Award, Star, Clock, Info, Calendar, ArrowRight, Users } from 'lucide-react';
import LoadingCard from './LoadingCard';
import BlockscoutTransactionHistory from './BlockscoutTransactionHistory';
import AmountDisplay from './shared/AmountDisplay';
import { 
  fetchTreasuryBalance, 
  fetchTeamsAndEmployees,
  processPayrollPayments,
  grantEmployeeOfWeekMerit,
  checkMeritCooldown,
  Employee,
  Team,
  TeamsAndEmployeesData,
  TreasuryBalance
} from '@/api/api_calls';
import { useWalletInfo } from '@/hooks/useWalletInfo';
import CreatePayrollPopup from './CreatePayrollPopup';
import PayrollPositionCard from './PayrollPositionCard';
import { useCompanyPayrolls } from '@/hooks/useCompanyPayrolls';
import { useReadContract } from 'wagmi';
import { payrollContractABI } from '@/abi/payrollContractABI';

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
  teamsData,
  walletAddress,
  chainId,
  balance
}: { 
  isLoading: boolean;
  currentAmount: number;
  onAmountUpdate: (newAmount: number) => void;
  teamsData?: TeamsAndEmployeesData;
  walletAddress?: string;
  chainId?: string;
  balance: TreasuryBalance | null;
}) => {
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
    <div 
      className="main-block-gradient"
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
      <AmountDisplay balance={balance} isLoading={isAmountLoading} />

      {/* Teams Budget Section */}
      {balance && teamBudgets.length > 0 && (
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
              // Calculate the actual payroll balance for the team
              const payrollBalance = team.payrollPositions?.reduce((total, position) => {
                // For each position, add the amount if it's active
                return total + (position.isActive ? Number(position.amount) : 0n);
              }, 0n) || 0n;

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
                      ${Number(payrollBalance) / 1e18}
                    </p>
                    <p style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      margin: 0
                    }}>
                      Payroll Balance
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
  currentBalance,
  teams
}: { 
  isLoading: boolean;
  onPaymentComplete: (amount: number) => void;
  currentBalance: number;
  teams: Team[];
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreatePayrollPopup, setShowCreatePayrollPopup] = useState(false);
  const { address: companyAddress } = useWalletInfo();
  const { payrolls, isLoading: isLoadingPayrolls, refetch: refetchPayrolls } = useCompanyPayrolls(
    companyAddress as `0x${string}` | undefined
  );

  const handleCreatePayment = () => {
    setShowCreatePayrollPopup(true);
  };

  const handlePayrollCreated = () => {
    onPaymentComplete(0); // Actualizar el balance después de crear el payroll
    refetchPayrolls(); // Refresh the payrolls list
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
      <div 
        className="main-block-gradient"
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
          position: 'relative',
          zIndex: 1,
          marginBottom: spacing.xl
        }}>
          <h2 style={{
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            margin: '0 0 8px 0'
          }}>
            Company Actions
          </h2>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            Manage payroll and employee rewards
          </p>
        </div>

        {/* Actions */}
        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          <button 
            onClick={handleCreatePayment}
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
                Create Payment
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
              Create a new payment for an employee
            </p>
          )}
        </div>
      </div>

      {/* Create Payroll Popup */}
      <CreatePayrollPopup
        isOpen={showCreatePayrollPopup}
        onClose={() => setShowCreatePayrollPopup(false)}
        onPayrollCreated={handlePayrollCreated}
        teams={teams}
        currentBalance={currentBalance}
      />
    </>
  );
};

const EmployeeMeritCard = ({ 
  isLoading, 
  teamsData,
  companyAddress,
  chainId 
}: { 
  isLoading: boolean;
  teamsData?: TeamsAndEmployeesData;
  companyAddress?: string;
  chainId?: string;
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isGrantingMerit, setIsGrantingMerit] = useState(false);
  const [canGrant, setCanGrant] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Check merit cooldown on mount and when company address changes
  useEffect(() => {
    if (companyAddress) {
      checkMeritCooldown(companyAddress).then(result => {
        setCanGrant(result.canGrant);
        setTimeRemaining(result.timeRemaining || null);
      });
    }
  }, [companyAddress]);

  // Update cooldown timer every second
  useEffect(() => {
    if (timeRemaining && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev && prev > 1000) {
            return prev - 1000;
          } else {
            setCanGrant(true);
            return null;
          }
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const allEmployees = teamsData?.teams.flatMap(team => team.members) || [];

  const handleGrantMerit = async () => {
    if (!selectedEmployee || !companyAddress || !canGrant) return;

    setIsGrantingMerit(true);
    
    try {
      const result = await grantEmployeeOfWeekMerit(
        selectedEmployee.walletAddress, 
        companyAddress, 
        chainId || '1'
      );
      
      if (result.success) {
        alert(`🏆 Merit granted successfully via Blockscout Merits API!\n\n` +
              `Employee: ${selectedEmployee.name}\n` +
              `Award: Employee of the Week\n` +
              `Merit Points: 1 (distributed via Blockscout)\n` +
              `Credit Score Bonus: +1 point\n\n` +
              `This merit has been distributed through the official Blockscout Merits system and will appear in the employee's credit score immediately.`);
        
        setSelectedEmployee(null);
        setCanGrant(false);
        setTimeRemaining(5000); // 5 seconds cooldown for testing
      } else {
        alert(`❌ Failed to grant merit via Blockscout:\n\n${result.error}\n\nNote: This cooldown applies to ALL employees in your company.`);
      }
    } catch (error) {
      console.error('Error granting merit:', error);
      alert('❌ Unexpected error occurred while granting merit. Please try again.');
    } finally {
      setIsGrantingMerit(false);
      setShowEmployeeDropdown(false);
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const seconds = Math.ceil(milliseconds / 1000);
    return `${seconds}s`;
  };

  if (isLoading) {
    return (
      <LoadingCard title="Loading Merit System..." showSpinner={true}>
        <p>Preparing employee recognition tools...</p>
      </LoadingCard>
    );
  }

  return (
    <div 
      className="main-block-gradient"
      style={{
        backgroundColor: 'white',
        padding: spacing.xl,
        borderRadius: '16px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 4px 12px ${colors.shadow}`,
        position: 'relative',
        overflow: 'hidden',
        zIndex: showEmployeeDropdown ? 10 : 1
      }}
    >
      {/* Background gradient */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '120px',
        height: '120px',
        background: `linear-gradient(135deg, #9333ea15, #7c3aed10)`,
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
              backgroundColor: '#9333ea',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={18} color="white" strokeWidth={2.5} />
            </div>
            <h3 style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: 0
            }}>
              Employee Merit System
            </h3>
          </div>
          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            Grant Employee of the Week via Blockscout Merits API
          </p>
        </div>

        {!canGrant && timeRemaining && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs,
            backgroundColor: '#fef3c7',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: '12px',
            border: '1px solid #fcd34d'
          }}>
            <Clock size={12} color="#d97706" strokeWidth={2} />
            <span style={{
              fontSize: typography.fontSize.xs,
              color: '#d97706',
              fontWeight: typography.fontWeight.medium
            }}>
              {formatTimeRemaining(timeRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Employee Selection */}
      <div style={{
        position: 'relative',
        zIndex: showEmployeeDropdown ? 10000 : 1,
        marginBottom: spacing.lg,
        overflow: showEmployeeDropdown ? 'visible' : 'hidden'
      }}>
        <label style={{
          fontSize: typography.fontSize.sm,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.primary,
          marginBottom: spacing.sm,
          display: 'block'
        }}>
          Select Employee
        </label>
        
        <div style={{ 
          position: 'relative',
          overflow: showEmployeeDropdown ? 'visible' : 'hidden'
        }}>
          <button
            onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
            disabled={!canGrant || isGrantingMerit}
            style={{
              width: '100%',
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor: (!canGrant || isGrantingMerit) ? colors.light : 'white',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              fontSize: typography.fontSize.sm,
              color: selectedEmployee ? colors.text.primary : colors.text.secondary,
              cursor: (!canGrant || isGrantingMerit) ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>
              {selectedEmployee ? selectedEmployee.name : 'Choose an employee...'}
            </span>
            <span style={{ transform: showEmployeeDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
              ▼
            </span>
          </button>

          {showEmployeeDropdown && canGrant && !isGrantingMerit && (
            <>
              {/* Backdrop to handle clicks outside */}
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 50000,
                  backgroundColor: 'transparent'
                }}
                onClick={() => setShowEmployeeDropdown(false)}
              />
              
              {/* Dropdown */}
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                boxShadow: `0 12px 32px rgba(0, 0, 0, 0.25)`,
                zIndex: 50001,
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
                {allEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => {
                      setSelectedEmployee(employee);
                      setShowEmployeeDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      padding: `${spacing.sm} ${spacing.lg}`,
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                      borderBottom: `1px solid ${colors.border}`,
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.light;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: typography.fontWeight.medium }}>
                      {employee.name}
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      marginTop: '2px'
                    }}>
                      {employee.walletAddress.substring(0, 8)}...{employee.walletAddress.substring(employee.walletAddress.length - 6)}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grant Merit Button */}
      <div style={{
        position: 'relative',
        zIndex: 1
      }}>
        <button 
          onClick={handleGrantMerit}
          disabled={!selectedEmployee || !canGrant || isGrantingMerit}
          style={{
            width: '100%',
            backgroundColor: (!selectedEmployee || !canGrant || isGrantingMerit) ? colors.text.secondary : '#9333ea',
            color: 'white',
            border: 'none',
            padding: `${spacing.md} ${spacing.lg}`,
            borderRadius: '12px',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: (!selectedEmployee || !canGrant || isGrantingMerit) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.2s ease',
            boxShadow: (!selectedEmployee || !canGrant || isGrantingMerit) ? 'none' : '0 2px 8px rgba(147, 51, 234, 0.3)'
          }}
        >
          {isGrantingMerit ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: `2px solid rgba(255, 255, 255, 0.3)`,
                borderTop: `2px solid white`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Creating Blockchain Transaction...
            </>
          ) : !canGrant ? (
            <>
              <Clock size={18} strokeWidth={2} />
              Merit Cooldown Active (All Employees)
            </>
          ) : (
            <>
              <Star size={18} strokeWidth={2} />
              Grant Employee of the Week
            </>
          )}
        </button>

        {selectedEmployee && canGrant && !isGrantingMerit && (
          <p style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            margin: `${spacing.sm} 0 0 0`,
            textAlign: 'center'
          }}>
            Awards +1 merit point to {selectedEmployee.name} via Blockscout Merits API
          </p>
        )}

        {!canGrant && (
          <p style={{
            fontSize: typography.fontSize.xs,
            color: '#d97706',
            margin: `${spacing.sm} 0 0 0`,
            textAlign: 'center',
            fontWeight: typography.fontWeight.medium
          }}>
            Merit cooldown active for ALL employees (5s in testing mode)
          </p>
        )}
      </div>
    </div>
  );
};

const TeamBudgets = ({ teams }: { teams: Team[] }) => {
  return (
    <div style={{
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: '16px',
      border: `1px solid ${colors.border}`
    }}>
      <h3 style={{
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        margin: '0 0 16px 0'
      }}>
        Team Budgets
      </h3>

      <div style={{
        display: 'flex',
        gap: spacing.md,
        overflowX: 'auto',
        paddingBottom: spacing.sm,
        // Hide scrollbar but keep functionality
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}>
        {teams.map((team, index) => (
          <div key={team.id} style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {/* Team Budget Card */}
            <div style={{
              backgroundColor: colors.surface,
              padding: spacing.md,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              minWidth: '140px',
              flexShrink: 0
            }}>
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
                  margin: 0,
                  flex: 1
                }}>
                  {team.name}
                </h5>
              </div>

              <div>
                <p style={{
                  fontSize: typography.fontSize.lg,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.text.primary,
                  margin: '0 0 2px 0',
                  lineHeight: 1
                }}>
                  ${Number(team.budget) / 1e18}
                </p>
                <p style={{
                  fontSize: typography.fontSize.xs,
                  color: colors.text.secondary,
                  margin: 0
                }}>
                  Available Budget
                </p>
              </div>
            </div>

            {/* Payroll Positions */}
            {team.payrollPositions?.map((position, posIndex) => (
              <PayrollPositionCard
                key={`${team.id}-${posIndex}`}
                payrollId={position.payrollId}
                positionIndex={position.positionIndex}
                teamName={team.name}
                teamColor={team.color}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const PayrollInfoPopup = ({ 
  isOpen, 
  onClose, 
  payroll 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  payroll: {
    payrollId: bigint;
    positionIndex: bigint;
    amount: bigint;
    isActive: boolean;
  } | null;
}) => {
  const { data: positionInfo, isLoading: isLoadingPositionInfo } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
    abi: payrollContractABI,
    functionName: 'getPositionInfo',
    args: payroll ? [payroll.payrollId, payroll.positionIndex] : undefined,
    query: {
      enabled: !!payroll
    }
  });

  const { data: payrollInfoData, isLoading: isLoadingPayrollInfo } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
    abi: payrollContractABI,
    functionName: 'getPayrollInfo',
    args: payroll ? [payroll.payrollId] : undefined,
    query: {
      enabled: !!payroll
    }
  });

  const { data: beneficiariesData, isLoading: isLoadingBeneficiaries } = useReadContract({
    address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
    abi: payrollContractABI,
    functionName: 'getPayrollBeneficiaries',
    args: payroll ? [payroll.payrollId] : undefined,
    query: {
      enabled: !!payroll
    }
  });

  // Get beneficiary amounts
  const beneficiaryQueries = beneficiariesData ? (beneficiariesData as `0x${string}`[]).map(beneficiary => {
    const { data: amountData } = useReadContract({
      address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
      abi: payrollContractABI,
      functionName: 'payrollAmounts',
      args: [payroll?.payrollId as bigint, beneficiary],
      query: {
        enabled: !!payroll?.payrollId && !!beneficiary
      }
    });

    const { data: unlockTimeData } = useReadContract({
      address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
      abi: payrollContractABI,
      functionName: 'payrollUnlockTimes',
      args: [payroll?.payrollId as bigint, beneficiary],
      query: {
        enabled: !!payroll?.payrollId && !!beneficiary
      }
    });

    const { data: hasClaimedData } = useReadContract({
      address: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS as `0x${string}`,
      abi: payrollContractABI,
      functionName: 'payrollHasClaimed',
      args: [payroll?.payrollId as bigint, beneficiary],
      query: {
        enabled: !!payroll?.payrollId && !!beneficiary
      }
    });

    return {
      beneficiary,
      amount: amountData as bigint | undefined,
      unlockTime: unlockTimeData as bigint | undefined,
      hasClaimed: hasClaimedData as boolean | undefined
    };
  }) : [];

  if (!isOpen || !payroll) return null;

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const calculateProgress = () => {
    if (!payrollInfoData) return 0;
    const [_, __, startTime, endTime] = payrollInfoData as [bigint, bigint, bigint, bigint, bigint, boolean];
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (now <= startTime) return 0;
    if (now >= endTime) return 100;
    return Number((now - startTime) * 100n / (endTime - startTime));
  };

  const progress = calculateProgress();

  const [
    pool,
    _positionId,
    totalAmount,
    availableAmount,
    totalRewardsData,
    claimedRewardsData,
    isActive
  ] = positionInfo ? (positionInfo as [
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean
  ]) : [undefined, undefined, undefined, undefined, undefined, undefined, undefined];

  const [
    _positionIndex,
    _amount,
    startTime,
    endTime,
    claimedAmount,
    _isActive
  ] = payrollInfoData ? (payrollInfoData as [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean
  ]) : [undefined, undefined, undefined, undefined, undefined, undefined];

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
          maxWidth: '800px',
          width: '100%',
          maxHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15)`,
          overflow: 'auto'
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
                <Calendar size={18} color="white" strokeWidth={2.5} />
              </div>
              <h2 style={{
                fontSize: typography.fontSize.xl,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: 0
              }}>
                Vesting Schedule Details
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.text.secondary,
                cursor: 'pointer',
                padding: spacing.xs,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div style={{
            padding: spacing.xl,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.lg
          }}>
            {isLoadingPositionInfo || isLoadingPayrollInfo || isLoadingBeneficiaries ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: spacing.xl,
                gap: spacing.sm
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
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary
                }}>
                  Loading vesting information...
                </span>
              </div>
            ) : (
              <>
                {/* Vesting Schedule Info */}
                <div style={{
                  backgroundColor: colors.surface,
                  padding: spacing.lg,
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: spacing.md
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm
                    }}>
                      <div style={{
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary,
                        fontFamily: 'monospace'
                      }}>
                        Vesting Schedule #{payroll.payrollId.toString()}
                      </div>
                    </div>
                    <div style={{
                      fontSize: typography.fontSize.sm,
                      color: payroll.isActive ? colors.success : colors.text.secondary,
                      fontWeight: typography.fontWeight.medium,
                      backgroundColor: payroll.isActive ? `${colors.success}15` : colors.light,
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: '6px'
                    }}>
                      {payroll.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {/* Vesting Schedule Details */}
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
                        Start Date
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        color: colors.text.primary
                      }}>
                        {startTime ? formatDate(startTime) : 'Not set'}
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
                        {endTime ? formatDate(endTime) : 'Not set'}
                      </div>
                    </div>
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
                        #{payroll.positionIndex.toString()}
                      </div>
                    </div>
                  </div>

                  {/* Vesting Progress */}
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
                  backgroundColor: colors.surface,
                  padding: spacing.lg,
                  borderRadius: '12px',
                  border: `1px solid ${colors.border}`
                }}>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    marginBottom: spacing.md,
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
                          backgroundColor: colors.light,
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

                {/* Rewards Information */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing.md
                }}>
                  <div style={{
                    padding: spacing.md,
                    backgroundColor: colors.surface,
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
                      {totalRewardsData ? (Number(totalRewardsData) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} DAI
                    </div>
                  </div>
                  <div style={{
                    padding: spacing.md,
                    backgroundColor: colors.surface,
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
                      {claimedRewardsData ? (Number(claimedRewardsData) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} DAI
                    </div>
                  </div>
                  <div style={{
                    padding: spacing.md,
                    backgroundColor: colors.surface,
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
                      {totalRewardsData && claimedRewardsData ? 
                        ((Number(totalRewardsData - claimedRewardsData) / 1e18).toLocaleString(undefined, { maximumFractionDigits: 2 })) : '0'} DAI
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default function CompanyDashboard({ isLoading }: CompanyDashboardProps) {
  const [treasuryBalance, setTreasuryBalance] = useState<number>(0);
  const [teamsData, setTeamsData] = useState<TeamsAndEmployeesData | undefined>();
  const [balance, setBalance] = useState<TreasuryBalance | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const { address: walletAddress, chainId } = useWalletInfo();
  const { address: companyAddress } = useWalletInfo();
  const { payrolls, isLoading: isLoadingPayrolls, refetch: refetchPayrolls } = useCompanyPayrolls(
    companyAddress as `0x${string}` | undefined
  );
  const [selectedPayroll, setSelectedPayroll] = useState<{
    payrollId: bigint;
    positionIndex: bigint;
    amount: bigint;
    isActive: boolean;
  } | null>(null);

  // Fetch teams and employees data + balance
  useEffect(() => {
    if (!isLoading) {
      setIsDataLoading(true);
      
      Promise.all([
        fetchTeamsAndEmployees(),
        fetchTreasuryBalance(walletAddress ?? undefined, chainId || '1')
      ]).then(([teamsData, balanceData]) => {
        setTeamsData(teamsData);
        setBalance(balanceData);
        setIsDataLoading(false);
      }).catch((error) => {
        console.error('Error fetching company dashboard data:', error);
        setIsDataLoading(false);
      });
    }
  }, [isLoading, walletAddress, chainId]);

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
          isLoading={isLoading || isDataLoading} 
          currentAmount={treasuryBalance}
          onAmountUpdate={(newAmount) => setTreasuryBalance(newAmount)}
          teamsData={teamsData}
          walletAddress={walletAddress ?? undefined}
          chainId={chainId ?? undefined}
          balance={balance}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
          <ActionsCard 
            isLoading={isLoading || isDataLoading}
            onPaymentComplete={handlePaymentComplete}
            currentBalance={treasuryBalance}
            teams={teamsData?.teams || []}
          />
          
          {/* Payrolls List */}
          <div 
            className="main-block-gradient"
            style={{
              backgroundColor: 'white',
              padding: spacing.lg,
              borderRadius: '16px',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 4px 12px ${colors.shadow}`
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.md
            }}>
              <h3 style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                margin: 0
              }}>
                Last 3 Payrolls
              </h3>
              <button
                onClick={() => refetchPayrolls()}
                style={{
                  backgroundColor: colors.light,
                  color: colors.text.secondary,
                  border: 'none',
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: '6px',
                  fontSize: typography.fontSize.xs,
                  fontWeight: typography.fontWeight.medium,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.xs
                }}
              >
                <Info size={14} />
                Refresh
              </button>
            </div>

            {isLoadingPayrolls ? (
              <div style={{
                padding: spacing.sm,
                backgroundColor: colors.surface,
                borderRadius: '8px',
                textAlign: 'center',
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm
              }}>
                Loading payrolls...
              </div>
            ) : payrolls.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.sm
              }}>
                {payrolls.slice(-3).reverse().map((payroll) => (
                  <div
                    key={`${payroll.payrollId}-${payroll.positionIndex}`}
                    style={{
                      backgroundColor: colors.surface,
                      padding: spacing.md,
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.md
                      }}>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                          fontFamily: 'monospace',
                          backgroundColor: colors.light,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: '4px'
                        }}>
                          #{payroll.payrollId.toString()}
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          color: colors.text.secondary,
                          fontFamily: 'monospace'
                        }}>
                          Pos #{payroll.positionIndex.toString()}
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.primary
                        }}>
                          ${Number(payroll.amount) / 1e18}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm
                      }}>
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          color: payroll.isActive ? colors.success : colors.text.secondary,
                          fontWeight: typography.fontWeight.medium,
                          backgroundColor: payroll.isActive ? `${colors.success}15` : colors.light,
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: '4px'
                        }}>
                          {payroll.isActive ? 'Active' : 'Inactive'}
                        </div>
                        <button
                          onClick={() => setSelectedPayroll(payroll)}
                          style={{
                            backgroundColor: colors.light,
                            color: colors.text.primary,
                            border: 'none',
                            padding: `${spacing.xs} ${spacing.sm}`,
                            borderRadius: '4px',
                            fontSize: typography.fontSize.xs,
                            fontWeight: typography.fontWeight.medium,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs
                          }}
                        >
                          <Info size={12} />
                          Info
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: spacing.sm,
                backgroundColor: colors.surface,
                borderRadius: '8px',
                textAlign: 'center',
                color: colors.text.secondary,
                fontSize: typography.fontSize.sm
              }}>
                No payrolls found
              </div>
            )}
          </div>
        </div>
        <EmployeeMeritCard 
          isLoading={isLoading || isDataLoading}
          teamsData={teamsData}
          companyAddress={walletAddress ?? undefined}
          chainId={chainId ?? undefined}
        />
        <BlockscoutTransactionHistory
          companyAddress={walletAddress ?? undefined}
          employeeAddresses={teamsData?.teams.flatMap(team => team.members.map(member => member.walletAddress))}
          title="Transaction History"
          userRole="company"
          showAllTransactions={true}
        />
      </div>

      {/* Payroll Info Popup */}
      <PayrollInfoPopup
        isOpen={selectedPayroll !== null}
        onClose={() => setSelectedPayroll(null)}
        payroll={selectedPayroll}
      />
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