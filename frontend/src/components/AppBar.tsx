'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { User, Building2, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useDynamicContext, useSwitchNetwork } from '@dynamic-labs/sdk-react-core';
import { APP_NAME } from '@/constants/app';
import { isUserCompany } from '@/utils/userHelpers';
import { useWalletInfo } from '@/hooks/useWalletInfo';
import { CHAIN_CONFIGS } from '@/api/blockscout-api';
import { useState } from 'react';

interface AppBarProps {
  onMenuToggle: () => void;
  isMobile: boolean;
}

const NetworkSelector = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const switchNetwork = useSwitchNetwork();
  const { primaryWallet } = useDynamicContext();
  const { chainId } = useWalletInfo();

  const handleNetworkSwitch = async (targetChainId: string) => {
    if (!primaryWallet) return;
    
    try {
      await switchNetwork({ 
        wallet: primaryWallet, 
        network: parseInt(targetChainId) 
      });
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const currentChain = chainId ? CHAIN_CONFIGS[chainId] : null;
  const supportedChains = Object.values(CHAIN_CONFIGS);

  const getNetworkName = (targetChainId: string): string => {
    const names: Record<string, string> = {
      '1': 'Ethereum',
      '137': 'Polygon',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '747': 'Flow EVM'
    };
    return names[targetChainId] || `Chain ${targetChainId}`;
  };

  return (
    <div style={{ 
      position: 'relative',
      zIndex: 102
    }}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.xs,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: `${spacing.sm} ${spacing.md}`,
          borderRadius: '8px',
          border: 'none',
          cursor: 'pointer',
          fontSize: typography.fontSize.sm,
          color: 'white',
          fontWeight: typography.fontWeight.medium,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        {currentChain ? (
          <Wifi size={14} strokeWidth={2} />
        ) : (
          <WifiOff size={14} strokeWidth={2} />
        )}
        <span>
          {currentChain ? currentChain.nativeTokenSymbol : 'Unknown'}
        </span>
        <ChevronDown 
          size={12} 
          strokeWidth={2}
          style={{
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>

      {isDropdownOpen && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99998
            }}
            onClick={() => setIsDropdownOpen(false)}
          />
          
          {/* Dropdown */}
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: spacing.xs,
            backgroundColor: 'white',
            border: `1px solid ${colors.border}`,
            borderRadius: '12px',
            boxShadow: `0 8px 24px ${colors.shadow}`,
            minWidth: '180px',
            zIndex: 99999,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: `${spacing.sm} 0`,
              display: 'flex',
              flexDirection: 'column'
            }}>
              {supportedChains.map((chain) => (
                <button
                  key={chain.chainId}
                  onClick={() => handleNetworkSwitch(chain.chainId)}
                  disabled={chain.chainId === chainId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: `${spacing.sm} ${spacing.md}`,
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: chain.chainId === chainId ? 'default' : 'pointer',
                    fontSize: typography.fontSize.sm,
                    color: chain.chainId === chainId ? colors.text.light : colors.text.primary,
                    fontWeight: chain.chainId === chainId ? typography.fontWeight.semibold : typography.fontWeight.medium,
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background-color 0.2s ease',
                    opacity: chain.chainId === chainId ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (chain.chainId !== chainId) {
                      e.currentTarget.style.backgroundColor = colors.surface;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {chain.chainId === chainId ? (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#22c55e',
                      borderRadius: '50%'
                    }} />
                  ) : (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '50%'
                    }} />
                  )}
                  <div>
                    <div style={{ 
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.medium 
                    }}>
                      {getNetworkName(chain.chainId)}
                    </div>
                    <div style={{ 
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary 
                    }}>
                      {chain.nativeTokenSymbol}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function AppBar({ onMenuToggle, isMobile }: AppBarProps) {
  const { user, handleLogOut } = useDynamicContext();

  // Check if user is a company based on metadata
  const userIsCompany = isUserCompany(user);

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: `linear-gradient(to right, ${colors.primary} 0%, #ff9500 100%)`,
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${spacing.lg}`,
      boxShadow: `0 2px 8px ${colors.shadow}`,
      zIndex: 1000
    }}>
      {/* Logo - Always leftmost */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginRight: spacing.md
      }}>
        <img 
          src="/VankCliff_Logo.svg" 
          alt="VankCliff Logo"
          style={{
            height: '40px',
            width: 'auto'
          }}
        />
      </div>

      {/* Hamburger Menu Button - Only visible on mobile */}
      {isMobile && (
        <button
          onClick={onMenuToggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            marginRight: spacing.lg,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '24px',
            height: '24px',
            gap: '4px'
          }}
          aria-label="Toggle menu"
        >
          <span style={{
            width: '20px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px'
          }} />
          <span style={{
            width: '20px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px'
          }} />
          <span style={{
            width: '20px',
            height: '2px',
            backgroundColor: 'white',
            borderRadius: '1px'
          }} />
        </button>
      )}

      {/* Logo and Title with User Type Indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md
      }}>
        <h1 style={{
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize.xl,
          fontWeight: typography.fontWeight.bold,
          color: 'white',
          margin: 0
        }}>
          {APP_NAME}
        </h1>
        
        {/* User Type Indicator */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            padding: `${spacing.xs} ${spacing.sm}`,
            borderRadius: '12px',
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.medium,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            gap: spacing.xs
          }}>
            {userIsCompany ? (
              <Building2 size={14} color="white" strokeWidth={2} />
            ) : (
              <User size={14} color="white" strokeWidth={2} />
            )}
            {userIsCompany ? 'Company' : 'Employee'}
          </div>
        )}
      </div>

      {/* Right side - User info and actions */}
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: spacing.md
      }}>
        {/* Network Selector - Show for all users */}
        {user && <NetworkSelector />}

        {/* User wallet address */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: colors.mint,
              borderRadius: '50%'
            }} />
            <span style={{
              color: 'white',
              fontSize: typography.fontSize.sm,
              fontFamily: typography.fontFamily,
              fontWeight: typography.fontWeight.medium
            }}>
              {user.email || 
               (user.verifiedCredentials?.[0]?.address?.slice(0, 6) + '...' + 
                user.verifiedCredentials?.[0]?.address?.slice(-4)) ||
               'Connected'}
            </span>
          </div>
        )}

        {/* Logout button */}
        <button 
          onClick={handleLogOut}
          style={{
            background: colors.secondary,
            border: 'none',
            color: 'white',
            padding: `${spacing.sm} ${spacing.md}`,
            borderRadius: '6px',
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.sm,
            fontWeight: typography.fontWeight.medium,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.secondary;
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
} 