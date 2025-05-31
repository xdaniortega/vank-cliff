'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { DollarSign, HandCoins, CreditCard, TrendingUp, Coins, ArrowDownLeft } from 'lucide-react';
import LoadingCard from './LoadingCard';
import BlockscoutTransactionHistory from './BlockscoutTransactionHistory';
import AmountDisplay from './shared/AmountDisplay';
import { 
  fetchIndividualBalance,
  fetchCreditScore,
  fetchNetworkInfo,
  IndividualBalance,
  CreditScore,
  NetworkInfo,
  Merit
} from '@/api/api_calls';
import { useWalletInfo } from '@/hooks/useWalletInfo';

interface IndividualDashboardProps {
  isLoading: boolean;
}

// Credit Score Half-Arch Component
const CreditScoreGauge = ({ 
  score, 
  maxScore, 
  extraMerits 
}: { 
  score: number; 
  maxScore: number; 
  extraMerits?: Merit[];
}) => {
  const percentage = (score / maxScore) * 100;
  const angle = (percentage / 100) * 180; // Half circle is 180 degrees
  
  // Calculate base score without merits for layered display
  const meritBonus = extraMerits?.reduce((sum, merit) => sum + merit.meritValue, 0) || 0;
  const baseScore = score - meritBonus;
  const basePercentage = (baseScore / maxScore) * 100;
  const baseAngle = (basePercentage / 100) * 180;
  
  // Calculate merit bonus angle
  const meritPercentage = (meritBonus / maxScore) * 100;
  const meritAngle = (meritPercentage / 100) * 180;

  // Colors: Base score always green, extra merits always purple
  const baseScoreColor = '#22c55e'; // Green for base credit score
  const meritColor = '#9333ea'; // Purple for merits

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
        {/* Base credit score arc (always green) */}
        <path
          d="M 20 90 A 80 80 0 0 1 180 90"
          fill="none"
          stroke={baseScoreColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(baseAngle / 180) * 251.3} 251.3`}
          style={{
            transition: 'stroke-dasharray 1s ease-in-out'
          }}
        />
        {/* Merit bonus arc (purple, on top of base score) */}
        {meritBonus > 0 && (
          <path
            d="M 20 90 A 80 80 0 0 1 180 90"
            fill="none"
            stroke={meritColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(meritAngle / 180) * 251.3} 251.3`}
            strokeDashoffset={-((baseAngle / 180) * 251.3)}
            style={{
              transition: 'stroke-dasharray 1s ease-in-out, stroke-dashoffset 1s ease-in-out'
            }}
          />
        )}
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
          color: meritBonus > 0 ? meritColor : baseScoreColor,
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
        {meritBonus > 0 && (
          <div style={{
            fontSize: typography.fontSize.xs,
            color: meritColor,
            fontWeight: typography.fontWeight.medium,
            marginTop: '2px'
          }}>
            +{meritBonus} extra merits
          </div>
        )}
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
      <AmountDisplay balance={balance} showMarginBottom={false} />
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
  const [showNetworks, setShowNetworks] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [isFetchingNetworkInfo, setIsFetchingNetworkInfo] = useState(false);
  const [meritsExpanded, setMeritsExpanded] = useState(false);

  // Get wallet info for network calls
  const { address: connectedAddress } = useWalletInfo();

  // Define available networks
  const networks = [
    { name: 'Ethereum', color: '#627EEA', shortName: 'ETH' },
    { name: 'Polygon', color: '#8247E5', shortName: 'MATIC' },
    { name: 'Arbitrum', color: '#28A0F0', shortName: 'ARB' },
    { name: 'Optimism', color: '#FF0420', shortName: 'OP' },
    { name: 'Base', color: '#0052FF', shortName: 'BASE' }
  ];

  const handleRequestMoney = () => {
    if (!showNetworks) {
      setShowNetworks(true);
      setNetworkInfo(null); // Clear previous network info
    }
  };

  const handleNetworkSelect = async (networkName: string) => {
    setIsFetchingNetworkInfo(true);
    
    try {
      // Fetch network information
      const networkData = await fetchNetworkInfo(networkName, connectedAddress ?? undefined);
      setNetworkInfo(networkData);
      
      // Callback with selected network and data
      onNetworkSelected(networkName, networkData);
      
      // Show network info for a moment before proceeding
      setTimeout(() => {
        setIsRequestingMoney(true);
        setShowNetworks(false);
        setIsFetchingNetworkInfo(false);
        
        // Simulate API call
        setTimeout(() => {
          setIsRequestingMoney(false);
          alert(`Money request sent on ${networkName} network!\nBalance: ${networkData.balance.toFixed(4)} ${networkData.balanceSymbol}\nBlock: ${networkData.blockNumber || 'N/A'}`);
        }, 2000);
      }, 1500);
      
    } catch (error) {
      console.error('Error fetching network info:', error);
      setIsFetchingNetworkInfo(false);
      alert(`Error fetching ${networkName} network information`);
    }
  };

  const onNetworkSelected = (networkName: string, networkData: NetworkInfo) => {
    console.log('Selected network:', networkName);
    console.log('Network data:', networkData);
    // This is the callback that receives the network name and data
    // You can replace this with your actual callback logic
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
    <div 
      className="main-block-gradient-light"
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
            <CreditScoreGauge score={creditScore.score} maxScore={creditScore.maxScore} extraMerits={creditScore.extraMerits} />
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
            
            {/* Extra Merits Display */}
            {creditScore.extraMerits && creditScore.extraMerits.length > 0 && (
              <div style={{
                marginTop: spacing.md,
                padding: spacing.md,
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
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
                    gap: spacing.xs
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#9333ea',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <TrendingUp size={10} color="white" strokeWidth={2.5} />
                    </div>
                    <span style={{
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.semibold,
                      color: '#9333ea'
                    }}>
                      Extra Merits ({creditScore.extraMerits.length})
                    </span>
                  </div>
                  
                  {creditScore.extraMerits.length > 3 && (
                    <button
                      onClick={() => setMeritsExpanded(!meritsExpanded)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: typography.fontSize.xs,
                        color: '#9333ea',
                        cursor: 'pointer',
                        fontWeight: typography.fontWeight.medium,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {meritsExpanded ? 'Show Less' : 'Show All'}
                    </button>
                  )}
                </div>
                
                <div 
                  className="merits-container"
                  style={{
                    maxHeight: meritsExpanded ? '200px' : 'auto',
                    overflowY: meritsExpanded ? 'auto' : 'visible',
                    paddingRight: meritsExpanded ? spacing.xs : '0'
                  }}
                >
                  {(meritsExpanded ? creditScore.extraMerits : creditScore.extraMerits.slice(0, 3)).map((merit, index) => (
                    <div key={merit.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: spacing.xs,
                      backgroundColor: index === 0 ? '#f3f4f6' : 'transparent',
                      borderRadius: '4px',
                      marginBottom: spacing.xs
                    }}>
                      <div>
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs
                        }}>
                          {merit.title}
                          {merit.description.includes('from Blockscout') && (
                            <span style={{
                              fontSize: typography.fontSize.xs,
                              backgroundColor: '#9333ea',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: typography.fontWeight.bold
                            }}>
                              VERIFIED
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: typography.fontSize.xs,
                          color: colors.text.secondary,
                          marginTop: '1px'
                        }}>
                          {merit.awardedDate.toLocaleDateString()}
                          {merit.description.includes('from Blockscout') && (
                            <span style={{
                              marginLeft: spacing.xs,
                              fontStyle: 'italic'
                            }}>
                              via Blockscout Merits
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.xs,
                        fontWeight: typography.fontWeight.bold,
                        color: '#9333ea'
                      }}>
                        +{merit.meritValue}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  textAlign: 'center',
                  marginTop: spacing.sm,
                  padding: `${spacing.xs} 0`,
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary
                  }}>
                    Higher yields & better loan rates available
                  </span>
                </div>
              </div>
            )}
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
          disabled={isRequestingMoney || isFetchingNetworkInfo}
          style={{
            width: '100%',
            backgroundColor: showNetworks ? colors.accent : (isRequestingMoney ? colors.text.secondary : colors.primary),
            color: 'white',
            border: 'none',
            padding: showNetworks ? spacing.sm : `${spacing.md} ${spacing.lg}`,
            borderRadius: '12px',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: (isRequestingMoney || isFetchingNetworkInfo) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            transition: 'all 0.3s ease',
            boxShadow: (isRequestingMoney || isFetchingNetworkInfo) ? 'none' : `0 2px 8px ${showNetworks ? colors.accent : colors.primary}30`,
            minHeight: '48px'
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
          ) : isFetchingNetworkInfo ? (
            <>
              <div style={{
                width: '18px',
                height: '18px',
                border: `2px solid rgba(255, 255, 255, 0.3)`,
                borderTop: `2px solid white`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Fetching network data...
            </>
          ) : networkInfo ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: spacing.xs,
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold
              }}>
                {networkInfo.networkName} Network
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                opacity: 0.9
              }}>
                Balance: {networkInfo.balance.toFixed(4)} {networkInfo.balanceSymbol}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                opacity: 0.9
              }}>
                Block: {networkInfo.blockNumber || 'N/A'}
              </div>
            </div>
          ) : showNetworks ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: spacing.sm
            }}>
              <div style={{
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                marginBottom: spacing.xs,
                textAlign: 'center'
              }}>
                Select Network
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: spacing.sm
              }}>
                {networks.map((network) => (
                  <div
                    key={network.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNetworkSelect(network.name);
                    }}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: network.color,
                      border: '2px solid white',
                      color: 'white',
                      fontSize: typography.fontSize.xs,
                      fontWeight: typography.fontWeight.bold,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      userSelect: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    {network.shortName}
                  </div>
                ))}
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNetworks(false);
                }}
                style={{
                  alignSelf: 'center',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: `${spacing.xs} ${spacing.sm}`,
                  borderRadius: '6px',
                  fontSize: typography.fontSize.xs,
                  cursor: 'pointer',
                  marginTop: spacing.xs,
                  userSelect: 'none'
                }}
              >
                Cancel
              </div>
            </div>
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
        fetchCreditScore(connectedAddress || undefined, chainId || '1')
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

  // Real employee data - only one employee
  const employeeAddress = '0x6Bf22C8B5a12bC8aEb8467846c91B4Efefa0edb7';
  // Company address would be the connected wallet for company users
  const companyAddress = connectedAddress;

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
        gridTemplateColumns: '1fr',
        gap: spacing.xl
      }}>
        <BlockscoutTransactionHistory
          companyAddress={companyAddress ?? undefined}
          employeeAddresses={[employeeAddress]}
          userRole="individual"
          userAddress={connectedAddress ?? undefined}
          title="My Transaction History"
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
    
    /* Custom scrollbar for merits container */
    .merits-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .merits-container::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }
    
    .merits-container::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }
    
    .merits-container::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `;
  if (!document.head.querySelector('style[data-animation="spin"]')) {
    style.setAttribute('data-animation', 'spin');
    document.head.appendChild(style);
  }
} 