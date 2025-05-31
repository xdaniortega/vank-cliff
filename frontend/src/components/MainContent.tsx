'use client';

import { colors, typography, spacing } from '@/theme/colors';
import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isUserCompany } from '@/utils/userHelpers';
import LoadingCard from './LoadingCard';
import LoadingSpinner from './LoadingSpinner';
import IndividualDashboard from './IndividualDashboard';
import CompanyDashboard from './CompanyDashboard';
import { Building2, Users, Plus, X, User, Wallet, UserPlus, Briefcase, Trash2, Globe, MapPin, Calendar, Badge, Clock } from 'lucide-react';
import { 
  fetchSectionData,
  fetchTeamsAndEmployees,
  addEmployee,
  createTeam,
  deleteTeam,
  fetchClientCompanyInfo,
  Team,
  Employee,
  TeamsAndEmployeesData,
  AddEmployeeRequest,
  CreateTeamRequest,
  ClientCompanyInfo
} from '@/api/api_calls';

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
    
    // Use centralized API call
    fetchSectionData(sectionId)
      .then((mockData) => {
        setData(mockData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching section data:', error);
        setLoading(false);
      });
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
    <div 
      className="main-block-gradient"
      style={{
        backgroundColor: 'white',
        padding: spacing.xl,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 2px 8px ${colors.shadow}`
      }}
    >
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
    <div 
      className="main-block-gradient-light"
      style={{
        backgroundColor: 'white',
        padding: spacing.xl,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 2px 8px ${colors.shadow}`
      }}
    >
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
    <div 
      className="main-block-gradient-reverse"
      style={{
        backgroundColor: 'white',
        padding: spacing.xl,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 2px 8px ${colors.shadow}`
      }}
    >
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

// Add Employee Popup Component
const AddEmployeePopup = ({ 
  isOpen, 
  onClose, 
  teams,
  onEmployeeAdded
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  teams: Team[];
  onEmployeeAdded: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    walletAddress: '',
    teamId: '',
    salary: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset form when opening
      setFormData({ name: '', walletAddress: '', teamId: '', salary: 0 });
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.walletAddress || !formData.teamId || formData.salary <= 0) {
      setError('Please fill in all fields with valid values');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await addEmployee(formData as AddEmployeeRequest);
      if (result.success) {
        onEmployeeAdded();
        onClose();
      } else {
        setError(result.error || 'Failed to add employee');
      }
    } catch (error) {
      setError('An error occurred while adding the employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15)`
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.xl,
          borderBottom: `1px solid ${colors.border}`
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
              <UserPlus size={18} color="white" strokeWidth={2.5} />
            </div>
            <h2 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0
            }}>
              Add New Employee
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: spacing.xs,
            borderRadius: '6px'
          }}>
            <X size={20} color={colors.text.secondary} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: spacing.xl }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: spacing.sm,
              marginBottom: spacing.md,
              color: '#dc2626',
              fontSize: typography.fontSize.sm
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {/* Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs
              }}>
                Employee Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: typography.fontSize.sm,
                  boxSizing: 'border-box'
                }}
                placeholder="Enter employee name"
                disabled={isSubmitting}
              />
            </div>

            {/* Wallet Address */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs
              }}>
                Wallet Address *
              </label>
              <input
                type="text"
                value={formData.walletAddress}
                onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: typography.fontSize.sm,
                  fontFamily: 'monospace',
                  boxSizing: 'border-box'
                }}
                placeholder="0x..."
                disabled={isSubmitting}
              />
            </div>

            {/* Team Selection */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs
              }}>
                Team *
              </label>
              <select
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: typography.fontSize.sm,
                  boxSizing: 'border-box'
                }}
                disabled={isSubmitting}
              >
                <option value="">Select a team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs
              }}>
                Monthly Salary *
              </label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: typography.fontSize.sm,
                  boxSizing: 'border-box'
                }}
                placeholder="5000"
                min="0"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'flex-end',
            marginTop: spacing.lg
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                border: `1px solid ${colors.border}`,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#9ca3af' : colors.primary,
                color: 'white',
                border: 'none',
                padding: `${spacing.sm} ${spacing.lg}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: `2px solid rgba(255, 255, 255, 0.3)`,
                    borderTop: `2px solid white`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus size={14} strokeWidth={2} />
                  Add Employee
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create Team Popup Component
const CreateTeamPopup = ({ 
  isOpen, 
  onClose, 
  onTeamCreated
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onTeamCreated: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#4ECDC4'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const predefinedColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FECA57', '#B8860B', '#DDA0DD', '#20B2AA'
  ];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormData({ name: '', color: '#4ECDC4' });
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Please provide a valid team name');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await createTeam({ ...formData, budget: 0 } as CreateTeamRequest);
      if (result.success) {
        onTeamCreated();
        onClose();
      } else {
        setError(result.error || 'Failed to create team');
      }
    } catch (error) {
      setError('An error occurred while creating the team');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15)`
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.xl,
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
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
              <Briefcase size={18} color="white" strokeWidth={2.5} />
            </div>
            <h2 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0
            }}>
              Create New Team
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: spacing.xs,
            borderRadius: '6px'
          }}>
            <X size={20} color={colors.text.secondary} strokeWidth={2} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: spacing.xl }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: spacing.sm,
              marginBottom: spacing.md,
              color: '#dc2626',
              fontSize: typography.fontSize.sm
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
            {/* Team Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs
              }}>
                Team Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: spacing.sm,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: typography.fontSize.sm,
                  boxSizing: 'border-box'
                }}
                placeholder="Enter team name"
                disabled={isSubmitting}
              />
            </div>

            {/* Color Selection */}
            <div>
              <label style={{
                display: 'block',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                marginBottom: spacing.xs
              }}>
                Team Color
              </label>
              <div style={{
                display: 'flex',
                gap: spacing.sm,
                flexWrap: 'wrap'
              }}>
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    disabled={isSubmitting}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: color,
                      border: formData.color === color ? `3px solid ${colors.text.primary}` : '2px solid transparent',
                      borderRadius: '50%',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Budget Info */}
            <div style={{
              backgroundColor: colors.light,
              padding: spacing.sm,
              borderRadius: '8px',
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary
            }}>
              💡 Team budget will be automatically calculated as the sum of all employee salaries in this team.
            </div>
          </div>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'flex-end',
            marginTop: spacing.lg
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                border: `1px solid ${colors.border}`,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? '#9ca3af' : colors.secondary,
                color: 'white',
                border: 'none',
                padding: `${spacing.sm} ${spacing.lg}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: `2px solid rgba(255, 255, 255, 0.3)`,
                    borderTop: `2px solid white`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Creating...
                </>
              ) : (
                <>
                  <Briefcase size={14} strokeWidth={2} />
                  Create Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Team Confirmation Popup Component
const DeleteTeamConfirmationPopup = ({ 
  isOpen, 
  onClose, 
  team,
  onTeamDeleted
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  team: Team | null;
  onTeamDeleted: () => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleDelete = async () => {
    if (!team) return;

    setIsDeleting(true);
    setError('');

    try {
      const result = await deleteTeam(team.id);
      if (result.success) {
        onTeamDeleted();
        onClose();
      } else {
        setError(result.error || 'Failed to delete team');
      }
    } catch (error) {
      setError('An error occurred while deleting the team');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !team) return null;

  const hasMembers = team.members.length > 0;

  return (
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
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15)`
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: spacing.xl,
          borderBottom: `1px solid ${colors.border}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#dc2626',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trash2 size={18} color="white" strokeWidth={2.5} />
            </div>
            <h2 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0
            }}>
              Delete Team
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: spacing.xs,
            borderRadius: '6px'
          }}>
            <X size={20} color={colors.text.secondary} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: spacing.xl }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: spacing.sm,
              marginBottom: spacing.md,
              color: '#dc2626',
              fontSize: typography.fontSize.sm
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.md
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: team.color,
              borderRadius: '50%'
            }}></div>
            <span style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary
            }}>
              {team.name}
            </span>
          </div>

          <p style={{
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
            marginBottom: spacing.md,
            lineHeight: 1.5
          }}>
            Are you sure you want to delete this team?
          </p>

          {hasMembers && (
            <div style={{
              backgroundColor: '#fef3cd',
              border: '1px solid #fde047',
              borderRadius: '8px',
              padding: spacing.sm,
              marginBottom: spacing.md
            }}>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: '#a16207',
                margin: 0,
                fontWeight: typography.fontWeight.medium
              }}>
                ⚠️ Warning: This team has {team.members.length} employee{team.members.length !== 1 ? 's' : ''}. 
                In a real application, you would need to reassign these employees to other teams before deleting.
              </p>
            </div>
          )}

          <p style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            margin: 0
          }}>
            This action cannot be undone.
          </p>

          {/* Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing.md,
            justifyContent: 'flex-end',
            marginTop: spacing.lg
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{
                backgroundColor: 'transparent',
                color: colors.text.secondary,
                border: `1px solid ${colors.border}`,
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: isDeleting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              style={{
                backgroundColor: isDeleting ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                padding: `${spacing.sm} ${spacing.lg}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}
            >
              {isDeleting ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: `2px solid rgba(255, 255, 255, 0.3)`,
                    borderTop: `2px solid white`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={14} strokeWidth={2} />
                  Delete Team
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Teams and Employees Management Component
const TeamsEmployeesManagement = ({ loading }: { loading: boolean }) => {
  const [teamsData, setTeamsData] = useState<TeamsAndEmployeesData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showDeleteTeam, setShowDeleteTeam] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchTeamsAndEmployees();
      setTeamsData(data);
    } catch (error) {
      console.error('Error fetching teams and employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [loading]);

  const handleEmployeeAdded = () => {
    fetchData(); // Refresh data
  };

  const handleTeamCreated = () => {
    fetchData(); // Refresh data
  };

  const handleTeamDeleted = () => {
    fetchData(); // Refresh data
  };

  const handleDeleteClick = (team: Team) => {
    setTeamToDelete(team);
    setShowDeleteTeam(true);
  };

  if (loading || isLoading) {
    return (
      <LoadingCard title="Loading Teams & Employees..." showSpinner={true}>
        <p>Fetching team and employee data...</p>
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
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 2px 8px ${colors.shadow}`
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.xl
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center'
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
              <Users size={24} color="white" strokeWidth={2} />
            </div>
            <div>
              <h3 style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.primary,
                margin: '0 0 4px 0'
              }}>
                Teams & Employees
              </h3>
              <p style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                margin: 0
              }}>
                {teamsData?.totalEmployees || 0} employees across {teamsData?.teams.length || 0} teams
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: spacing.sm
          }}>
            <button
              onClick={() => setShowCreateTeam(true)}
              style={{
                backgroundColor: colors.secondary,
                color: 'white',
                border: 'none',
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}
            >
              <Plus size={16} strokeWidth={2} />
              New Team
            </button>
            <button
              onClick={() => setShowAddEmployee(true)}
              style={{
                backgroundColor: colors.primary,
                color: 'white',
                border: 'none',
                padding: `${spacing.sm} ${spacing.md}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}
            >
              <Plus size={16} strokeWidth={2} />
              Add Employee
            </button>
          </div>
        </div>

        {/* Teams List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg
        }}>
          {teamsData?.teams.map((team) => (
            <div
              key={team.id}
              style={{
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: spacing.lg,
                backgroundColor: colors.surface
              }}
            >
              {/* Team Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.md
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: team.color,
                    borderRadius: '50%'
                  }}></div>
                  <h4 style={{
                    fontSize: typography.fontSize.base,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    margin: 0
                  }}>
                    {team.name}
                  </h4>
                  <span style={{
                    fontSize: typography.fontSize.xs,
                    color: colors.text.secondary,
                    backgroundColor: colors.light,
                    padding: `2px ${spacing.xs}`,
                    borderRadius: '4px'
                  }}>
                    {team.members.length} members
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.md
                }}>
                  <div style={{
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary
                  }}>
                    Budget: ${team.budget.toLocaleString()}
                    {team.budget === 0 && (
                      <span style={{
                        fontSize: typography.fontSize.xs,
                        color: colors.text.secondary,
                        fontWeight: typography.fontWeight.normal,
                        marginLeft: spacing.xs
                      }}>
                        (No employees)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteClick(team)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#dc2626',
                      border: `1px solid #dc2626`,
                      padding: spacing.xs,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete team"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>

              {/* Team Members */}
              {team.members.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: spacing.md
                }}>
                  {team.members.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: spacing.sm,
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: `1px solid ${colors.border}`
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: team.color,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <User size={14} color="white" strokeWidth={2} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h5 style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                          margin: '0 0 2px 0'
                        }}>
                          {member.name}
                        </h5>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.xs
                        }}>
                          <Wallet size={10} color={colors.text.secondary} strokeWidth={1.5} />
                          <span style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.text.secondary,
                            fontFamily: 'monospace'
                          }}>
                            {member.walletAddress.slice(0, 6)}...{member.walletAddress.slice(-4)}
                          </span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.semibold,
                        color: colors.text.primary
                      }}>
                        ${member.salary.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: `${spacing.lg} 0`,
                  color: colors.text.secondary,
                  fontSize: typography.fontSize.sm
                }}>
                  No employees in this team yet.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Popups */}
      <AddEmployeePopup
        isOpen={showAddEmployee}
        onClose={() => setShowAddEmployee(false)}
        teams={teamsData?.teams || []}
        onEmployeeAdded={handleEmployeeAdded}
      />
      <CreateTeamPopup
        isOpen={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onTeamCreated={handleTeamCreated}
      />
      <DeleteTeamConfirmationPopup
        isOpen={showDeleteTeam}
        onClose={() => {
          setShowDeleteTeam(false);
          setTeamToDelete(null);
        }}
        team={teamToDelete}
        onTeamDeleted={handleTeamDeleted}
      />
    </>
  );
};

// My Company Information Component
const MyCompanyInfo = ({ loading }: { loading: boolean }) => {
  const [companyInfo, setCompanyInfo] = useState<ClientCompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchClientCompanyInfo();
      setCompanyInfo(data);
    } catch (error) {
      console.error('Error fetching company information:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchData();
    }
  }, [loading]);

  if (loading || isLoading) {
    return (
      <LoadingCard title="Loading Company Information..." showSpinner={true}>
        <p>Fetching your company details...</p>
      </LoadingCard>
    );
  }

  if (!companyInfo) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: spacing.xl,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        boxShadow: `0 2px 8px ${colors.shadow}`,
        textAlign: 'center'
      }}>
        <p style={{
          color: colors.text.secondary,
          fontSize: typography.fontSize.base
        }}>
          Unable to load company information. Please try again later.
        </p>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateEmploymentDuration = (startDate: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} year${years !== 1 ? 's' : ''} ${months > 0 ? `and ${months} month${months !== 1 ? 's' : ''}` : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: spacing.xl
    }}>
      {/* Company Overview Card */}
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
        {/* Background gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `linear-gradient(135deg, ${colors.primary}10, ${colors.accent}05)`,
          borderRadius: '0 16px 0 100%'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.lg,
            marginBottom: spacing.xl
          }}>
            <div>
              <h2 style={{
                fontSize: typography.fontSize['2xl'],
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                margin: '0 0 8px 0'
              }}>
                {companyInfo.companyName}
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
                flexWrap: 'wrap'
              }}>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  backgroundColor: colors.light,
                  padding: `4px ${spacing.sm}`,
                  borderRadius: '6px'
                }}>
                  {companyInfo.industry}
                </span>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary
                }}>
                  Founded {companyInfo.foundedYear}
                </span>
                <span style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary
                }}>
                  {companyInfo.employeeCount} employees
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
            lineHeight: 1.6,
            marginBottom: spacing.lg
          }}>
            {companyInfo.description}
          </p>

          {/* Company Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: spacing.lg
          }}>
            {/* Address */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.sm
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: colors.primary,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <MapPin size={16} color="white" strokeWidth={2} />
              </div>
              <div>
                <h4 style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  margin: '0 0 4px 0'
                }}>
                  Address
                </h4>
                <p style={{
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  margin: 0,
                  lineHeight: 1.4
                }}>
                  {companyInfo.address.street}<br />
                  {companyInfo.address.city}, {companyInfo.address.state} {companyInfo.address.zipCode}<br />
                  {companyInfo.address.country}
                </p>
              </div>
            </div>

            {/* Website */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: spacing.sm
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: colors.secondary,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Globe size={16} color="white" strokeWidth={2} />
              </div>
              <div>
                <h4 style={{
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.primary,
                  margin: '0 0 4px 0'
                }}>
                  Website
                </h4>
                <a
                  href={companyInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: typography.fontSize.sm,
                    color: colors.primary,
                    textDecoration: 'none'
                  }}
                >
                  {companyInfo.website}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employment Details Card */}
      <div 
        className="main-block-gradient-light"
        style={{
          backgroundColor: 'white',
          padding: spacing.xl,
          borderRadius: '16px',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 4px 12px ${colors.shadow}`
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          marginBottom: spacing.lg
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: colors.accent,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Badge size={18} color="white" strokeWidth={2.5} />
          </div>
          <h3 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            margin: 0
          }}>
            Your Employment Details
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: spacing.lg
        }}>
          {/* Position & Department */}
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: '0 0 8px 0'
            }}>
              Position
            </h4>
            <p style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: colors.primary,
              margin: '0 0 4px 0'
            }}>
              {companyInfo.employmentDetails.position}
            </p>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0
            }}>
              {companyInfo.employmentDetails.department} Department
            </p>
          </div>

          {/* Employment Duration */}
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: '0 0 8px 0'
            }}>
              Employment Duration
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              marginBottom: spacing.xs
            }}>
              <Calendar size={14} color={colors.text.secondary} strokeWidth={1.5} />
              <p style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
                margin: 0
              }}>
                Started {formatDate(companyInfo.employmentDetails.startDate)}
              </p>
            </div>
            <p style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.medium,
              color: colors.primary,
              margin: 0
            }}>
              {calculateEmploymentDuration(companyInfo.employmentDetails.startDate)}
            </p>
          </div>

          {/* Employment Type & Status */}
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: '0 0 8px 0'
            }}>
              Employment Type
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              marginBottom: spacing.xs
            }}>
              <span style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.primary,
                fontWeight: typography.fontWeight.medium
              }}>
                {companyInfo.employmentDetails.employmentType}
              </span>
              <span style={{
                fontSize: typography.fontSize.xs,
                color: '#059669',
                backgroundColor: '#d1fae5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: typography.fontWeight.medium
              }}>
                {companyInfo.employmentDetails.status}
              </span>
            </div>
            <p style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              margin: 0
            }}>
              Work Location: {companyInfo.employmentDetails.workLocation}
            </p>
          </div>

          {/* Manager */}
          <div style={{
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`
          }}>
            <h4 style={{
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              margin: '0 0 8px 0'
            }}>
              Reporting Manager
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                backgroundColor: colors.primary,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User size={12} color="white" strokeWidth={2} />
              </div>
              <p style={{
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.medium,
                color: colors.text.primary,
                margin: 0
              }}>
                {companyInfo.employmentDetails.manager}
              </p>
            </div>
          </div>
        </div>

        {/* Employee ID */}
        <div style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.light,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.medium
          }}>
            Employee ID:
          </span>
          <span style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.primary,
            fontFamily: 'monospace',
            fontWeight: typography.fontWeight.medium
          }}>
            {companyInfo.employmentDetails.employeeId}
          </span>
        </div>
      </div>
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
        return userIsCompany ? (
          <TeamsEmployeesManagement loading={loading} />
        ) : null;
      
      case 'mycompany':
        return !userIsCompany ? (
          <MyCompanyInfo loading={loading} />
        ) : null;
      
      default:
        return loading ? (
          <LoadingCard title={`Loading ${activeSection}...`} showSpinner={true}>
            <p>Preparing your {activeSection} data...</p>
          </LoadingCard>
        ) : (
          <div 
            className="main-block-gradient"
            style={{
              backgroundColor: 'white',
              padding: spacing.xl,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px ${colors.shadow}`
            }}
          >
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
      case 'company': return userIsCompany ? 'Teams & Employees' : 'Company';
      case 'mycompany': return 'My Company';
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
        
      </div>
    </main>
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
  `;
  if (!document.head.querySelector('style[data-animation="spin"]')) {
    style.setAttribute('data-animation', 'spin');
    document.head.appendChild(style);
  }
} 