import { useState, useEffect } from 'react';
import { colors, typography, spacing } from '@/theme/colors';
import { DollarSign, X, User, Wallet, Calendar } from 'lucide-react';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { CHAIN_IDS } from '@/contracts/addresses';
import type { Team, Employee } from '@/api/api_calls';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { erc20Abi } from '@/contracts/erc20Abi';

interface CreatePayrollPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPayrollCreated: () => void;
  teams: Team[];
  currentBalance: number;
}

const CreatePayrollPopup = ({
  isOpen,
  onClose,
  onPayrollCreated,
  teams,
  currentBalance
}: CreatePayrollPopupProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [amountTokenA, setAmountTokenA] = useState<string>('');
  const [amountTokenB, setAmountTokenB] = useState<string>('');
  const [startUnix, setStartUnix] = useState<string>('');
  const [endUnix, setEndUnix] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const { createPayroll, isPending } = usePayrollContract();

  const TOKEN_A_ADDRESS = '0xaaCA746b49D0F6021d4D8AdB6Bc7d25d0366cC96';
  const TOKEN_B_ADDRESS = '0xfA2E46102F25b0a694A931C3A5ad8C78a994E13D';

  const { address: userAddress } = useAccount();
  const { data: balanceA } = useReadContract({
    address: TOKEN_A_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress!],
  });
  const { data: balanceB } = useReadContract({
    address: TOKEN_B_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [userAddress!],
  });

  // Reset form when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset form
      setSelectedTeam('');
      setSelectedEmployee(null);
      setAmountTokenA('');
      setAmountTokenB('');
      setStartUnix('');
      setEndUnix('');
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
    if (!selectedEmployee || !amountTokenA || !amountTokenB || !startUnix || !endUnix) {
      setError('Please fill in all fields');
      return;
    }

    const amountTokenAInWei = BigInt(parseFloat(amountTokenA) * 1e18);
    const amountTokenBInWei = BigInt(parseFloat(amountTokenB) * 1e18);
    const startTimestamp = BigInt(startUnix);
    const endTimestamp = BigInt(endUnix);

    if (startTimestamp >= endTimestamp) {
      setError('End time (Unix) must be greater than start time (Unix)');
      return;
    }

    if (amountTokenAInWei <= 0n || amountTokenBInWei <= 0n) {
      setError('Amounts must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const payrollId = BigInt(Date.now());
      const receipt = await createPayroll(
        payrollId,
        BigInt(0), // positionIndex
        [selectedEmployee.walletAddress as `0x${string}`],
        [amountTokenAInWei, amountTokenBInWei],
        startTimestamp,
        endTimestamp
      );

      if (receipt) {
        onPayrollCreated();
        onClose();
      }
    } catch (error) {
      console.error('Error creating payroll:', error);
      setError(error instanceof Error ? error.message : 'Failed to create payroll');
    } finally {
      setIsSubmitting(false);
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
          width: '100%',
          maxWidth: '480px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 4px 24px ${colors.shadow}`
        }}>
          {/* Header */}
          <div style={{
            padding: spacing.xl,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h2 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
              margin: 0
            }}>
              Create Payment
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                padding: spacing.xs,
                cursor: 'pointer',
                color: colors.text.secondary,
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
            overflowY: 'auto'
          }}>
            <form onSubmit={handleSubmit}>
              {/* Team Selection */}
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing.xs
                }}>
                  Team
                </label>
                <select
                  value={selectedTeam}
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    setSelectedEmployee(null);
                  }}
                  style={{
                    width: '100%',
                    padding: spacing.sm,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    fontSize: typography.fontSize.sm,
                    backgroundColor: 'white'
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

              {/* Employee Selection */}
              {selectedTeam && (
                <div style={{ marginBottom: spacing.lg }}>
                  <label style={{
                    display: 'block',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text.primary,
                    marginBottom: spacing.xs
                  }}>
                    Employee
                  </label>
                  <select
                    value={selectedEmployee?.walletAddress || ''}
                    onChange={(e) => {
                      const team = teams.find(t => t.id === selectedTeam);
                      const employee = team?.members.find(m => m.walletAddress === e.target.value);
                      setSelectedEmployee(employee || null);
                    }}
                    style={{
                      width: '100%',
                      padding: spacing.sm,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: typography.fontSize.sm,
                      backgroundColor: 'white'
                    }}
                    disabled={isSubmitting}
                  >
                    <option value="">Select an employee</option>
                    {teams
                      .find(t => t.id === selectedTeam)
                      ?.members.map((employee) => (
                        <option key={employee.walletAddress} value={employee.walletAddress}>
                          {employee.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Amount Token A */}
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.primary, marginBottom: spacing.xs }}>
                   Amount Token A (DAI)
                </label>
                <div style={{ display: 'flex', gap: spacing.md }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                       <DollarSign size={16} style={{ position: 'absolute', left: spacing.sm, color: colors.text.secondary }} />
                       <input
                         type="number"
                         value={amountTokenA}
                         onChange={(e) => setAmountTokenA(e.target.value)}
                         style={{ width: '100%', padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: typography.fontSize.sm, backgroundColor: 'white' }}
                         placeholder="0.00"
                         min="0"
                         step="0.01"
                         disabled={isSubmitting}
                       />
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 }}>
                      Balance: {balanceA ? (Number(balanceA) / 1e18).toLocaleString() : '...'} DAI
                    </div>
                  </div>
                </div>
              </div>
              {/* Amount Token B */}
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.primary, marginBottom: spacing.xs }}>
                   Amount Token B (DAI)
                </label>
                <div style={{ display: 'flex', gap: spacing.md }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                       <DollarSign size={16} style={{ position: 'absolute', left: spacing.sm, color: colors.text.secondary }} />
                       <input
                         type="number"
                         value={amountTokenB}
                         onChange={(e) => setAmountTokenB(e.target.value)}
                         style={{ width: '100%', padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: typography.fontSize.sm, backgroundColor: 'white' }}
                         placeholder="0.00"
                         min="0"
                         step="0.01"
                         disabled={isSubmitting}
                       />
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 }}>
                      Balance: {balanceB ? (Number(balanceB) / 1e18).toLocaleString() : '...'} DAI
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Unix Timestamp (segundos) */}
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ display: 'block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.primary, marginBottom: spacing.xs }}>
                   Start Unix Timestamp (segundos)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                   <Calendar size={16} style={{ position: 'absolute', left: spacing.sm, color: colors.text.secondary }} />
                   <input
                     type="number"
                     value={startUnix}
                     onChange={(e) => setStartUnix(e.target.value)}
                     style={{ width: '100%', padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: typography.fontSize.sm, backgroundColor: 'white' }}
                     placeholder="ej. 1710000000"
                     min="0"
                     disabled={isSubmitting}
                   />
                </div>
              </div>

              {/* End Unix Timestamp (segundos) */}
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{ display: ' block', fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.text.primary, marginBottom: spacing.xs }}>
                   End Unix Timestamp (segundos)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                   <Calendar size={16} style={{ position: 'absolute', left: spacing.sm, color: colors.text.secondary }} />
                   <input
                     type="number"
                     value={endUnix}
                     onChange={(e) => setEndUnix(e.target.value) }
                     style={{ width: '100%', padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: typography.fontSize.sm, backgroundColor: 'white' }}
                     placeholder="ej. 1710000000"
                     min="0"
                     disabled={isSubmitting}
                   />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: spacing.sm,
                  marginBottom: spacing.lg,
                  color: '#dc2626',
                  fontSize: typography.fontSize.sm
                }}>
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div style={{
                display: 'flex',
                gap: spacing.md,
                justifyContent: 'flex-end'
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
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedEmployee || !amountTokenA || !amountTokenB || !startUnix || !endUnix}
                  style={{
                    backgroundColor: isSubmitting ? colors.text.secondary : colors.primary,
                    color: 'white',
                    border: 'none',
                    padding: `${spacing.sm} ${spacing.lg}`,
                    borderRadius: '8px',
                    fontSize: typography.fontSize.sm,
                    fontWeight: typography.fontWeight.semibold,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs,
                    minWidth: '120px',
                    justifyContent: 'center',
                    opacity: (!selectedEmployee || !amountTokenA || !amountTokenB || !startUnix || !endUnix) ? 0.6 : 1
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
                      <DollarSign size={14} strokeWidth={2} />
                      Create Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePayrollPopup; 