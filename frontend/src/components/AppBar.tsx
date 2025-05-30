'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { User, Building2 } from 'lucide-react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { APP_NAME } from '@/constants/app';
import { isUserCompany } from '@/utils/userHelpers';

interface AppBarProps {
  onMenuToggle: () => void;
  isMobile: boolean;
}

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
      backgroundColor: colors.primary,
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${spacing.lg}`,
      boxShadow: `0 2px 8px ${colors.shadow}`,
      zIndex: 1000
    }}>
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
        {/* VankCliff Logo */}
        <img 
          src="/VankCliff_Logo.svg"
          alt="VankCliff Logo"
          style={{
            height: '40px',
            width: 'auto',
            filter: 'brightness(0) invert(1)', // Makes the white logo visible on dark background
            objectFit: 'contain'
          }}
        />
        
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
            {userIsCompany ? 'Company' : 'Client'}
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