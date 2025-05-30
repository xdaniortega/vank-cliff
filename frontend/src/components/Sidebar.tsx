'use client';

import { colors, typography, spacing } from '@/theme/colors';

interface SidebarProps {
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'portfolio', label: 'Portfolio', icon: '💼' },
  { id: 'trading', label: 'Trading', icon: '📈' },
  { id: 'staking', label: 'Staking', icon: '🔐' },
  { id: 'defi', label: 'DeFi', icon: '🏛️' },
  { id: 'nfts', label: 'NFTs', icon: '🎨' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function Sidebar({ isOpen, isMobile, onClose, activeSection, onSectionChange }: SidebarProps) {
  const sidebarStyle = {
    position: 'fixed' as const,
    top: '64px',
    left: isMobile ? (isOpen ? '0' : '-280px') : '0',
    width: '280px',
    height: 'calc(100vh - 64px)',
    backgroundColor: colors.surface,
    borderRight: `1px solid ${colors.border}`,
    transition: 'left 0.3s ease',
    zIndex: 999,
    overflowY: 'auto' as const
  };

  const overlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' as const : 'hidden' as const,
    transition: 'opacity 0.3s ease, visibility 0.3s ease'
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div style={overlayStyle} onClick={onClose} />
      )}
      
      {/* Sidebar */}
      <nav style={sidebarStyle}>
        <div style={{
          padding: spacing.lg
        }}>
          <h2 style={{
            fontFamily: typography.fontFamily,
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: `0 0 ${spacing.lg} 0`
          }}>
            Sections
          </h2>
          
          <ul style={{
            listStyle: 'none',
            margin: 0,
            padding: 0
          }}>
            {sections.map((section) => (
              <li key={section.id} style={{ marginBottom: spacing.xs }}>
                <button
                  onClick={() => {
                    onSectionChange(section.id);
                    if (isMobile) onClose();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    padding: spacing.md,
                    border: 'none',
                    borderRadius: '8px',
                    background: activeSection === section.id ? colors.light : 'transparent',
                    color: activeSection === section.id ? colors.primary : colors.text.primary,
                    fontFamily: typography.fontFamily,
                    fontSize: typography.fontSize.base,
                    fontWeight: activeSection === section.id ? typography.fontWeight.medium : typography.fontWeight.normal,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.backgroundColor = colors.border;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: typography.fontSize.lg }}>
                    {section.icon}
                  </span>
                  <span>{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
} 