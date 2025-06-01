import { useState, useEffect, useMemo, useCallback } from 'react';
import { colors, typography, spacing } from '@/theme/colors';
import { DollarSign, X, User, Wallet, Calendar, Plus, Check, Info } from 'lucide-react';
import { usePayrollContract } from '@/hooks/usePayrollContract';
import { CHAIN_IDS } from '@/contracts/addresses';
import type { Team, Employee } from '@/api/api_calls';
import { useWalletInfo } from '@/hooks/useWalletInfo';
import { useReadContract } from 'wagmi';
import { erc20Abi } from '@/contracts/erc20Abi';
import { useCompanyPayrolls } from '@/hooks/useCompanyPayrolls';
import PayrollPositionCard from './PayrollPositionCard';
import { formatBalance } from '@/utils/formatUtils';
import { usePayrollId } from '@/hooks/usePayrollId';

interface LiquidityPosition {
  id: number;
  amountA: bigint;
  amountB: bigint;
  receipt: `0x${string}`;
}

// Add interface for payroll info
interface PayrollInfo {
  payrollId: bigint;
  positionIndex: bigint;
  amount: bigint;
  isActive: boolean;
}

interface CreatePayrollPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPayrollCreated: () => void;
  teams: Team[];
  currentBalance: number;
}

const CreatePayrollPopup: React.FC<CreatePayrollPopupProps> = ({
  isOpen,
  onClose,
  onPayrollCreated,
  teams,
  currentBalance
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [amountTokenA, setAmountTokenA] = useState<string>('');
  const [amountTokenB, setAmountTokenB] = useState<string>('');
  const [startUnix, setStartUnix] = useState<string>('');
  const [endUnix, setEndUnix] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'adding-liquidity' | 'creating-payroll'>('idle');
  const [liquidityPositions, setLiquidityPositions] = useState<LiquidityPosition[]>([]);
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [paymentId, setPaymentId] = useState<bigint | null>(null);
  const [selectedPayrollInfo, setSelectedPayrollInfo] = useState<PayrollInfo | null>(null);
  const { address: userAddress } = useWalletInfo();
  const { address: companyAddress } = useWalletInfo();
  const { getNextId } = usePayrollId(userAddress as string);

  // Memoize company address for useCompanyPayrolls
  const memoizedCompanyAddress = useMemo(() => 
    companyAddress as `0x${string}` | undefined, 
    [companyAddress]
  );

  const { payrolls, isLoading: isLoadingPayrolls, refetch: refetchPayrolls } = useCompanyPayrolls(memoizedCompanyAddress);

  const { addLiquidity, createPayroll, isPending } = usePayrollContract();

  const POOL_ADDRESS = '0xaB726376c4A028C0B13AD6FCf3f2f695EBDabAd0';
  const TOKEN_A_ADDRESS = '0xfA2E46102F25b0a694A931C3A5ad8C78a994E13D'; // Mock DAI
  const TOKEN_B_ADDRESS = '0xaaCA746b49D0F6021d4D8AdB6Bc7d25d0366cC96'; // Mock Token

  // Memoize token info queries
  const { data: tokenAInfo } = useReadContract({
    address: TOKEN_A_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
  });

  const { data: tokenBInfo } = useReadContract({
    address: TOKEN_B_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'symbol',
  });

  // Memoize balance queries
  const balanceQueryA = useReadContract({
    address: TOKEN_A_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress
    }
  });

  const balanceQueryB = useReadContract({
    address: TOKEN_B_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!userAddress
    }
  });

  // Memoize formatted balances
  const formattedBalances = useMemo(() => ({
    tokenA: formatBalance(balanceQueryA.data as bigint | null | undefined, 2, tokenAInfo?.toString() || ''),
    tokenB: formatBalance(balanceQueryB.data as bigint | null | undefined, 2, tokenBInfo?.toString() || ''),
  }), [balanceQueryA.data, balanceQueryB.data, tokenAInfo, tokenBInfo]);

  const resetForm = useCallback(() => {
    setSelectedTeam('');
    setSelectedEmployee(null);
    setAmountTokenA('');
    setAmountTokenB('');
    setStartUnix('');
    setEndUnix('');
    setError('');
    setPaymentId(null);
    setStatus('idle');
  }, []);

  // Función para obtener el timestamp actual en segundos
  const getCurrentTimestamp = useCallback(() => {
    return Math.floor(Date.now() / 1000).toString();
  }, []);

  // Inicializar con el timestamp actual
  useEffect(() => {
    if (isOpen) {
      const currentTimestamp = getCurrentTimestamp();
      setStartUnix(currentTimestamp);
      // Establecer el fin 30 días después por defecto
      setEndUnix((Number(currentTimestamp) + 30 * 24 * 60 * 60).toString());
    }
  }, [isOpen, getCurrentTimestamp]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      resetForm();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, resetForm]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    // Early validation
    if (!userAddress) {
      setError('No wallet address found. Please connect your wallet.');
      return;
    }

    if (!tokenAInfo || !tokenBInfo) {
      setError('Failed to fetch token information. Please try again.');
      return;
    }

    if (!selectedEmployee || !startUnix || !endUnix || !amountTokenA || !amountTokenB) {
      setError('Please fill in all fields and enter liquidity amounts');
      return;
    }

    // Store token symbols in variables that will be available throughout the async operation
    const tokenASymbol = String(tokenAInfo);
    const tokenBSymbol = String(tokenBInfo);

    // Use mock user address instead of selected employee's address
    const mockUserAddress = '0x8FC05A14Aa2AA4d858E18733C9b9a73b2c8b6Ffd' as `0x${string}`;

    // Store all necessary data in a closure to ensure it's available throughout the async operation
    const payrollData = {
      startTimestamp: BigInt(startUnix),
      endTimestamp: BigInt(endUnix),
      amountTokenAInWei: BigInt(parseFloat(amountTokenA) * 1e18),
      amountTokenBInWei: BigInt(parseFloat(amountTokenB) * 1e18),
      tokenASymbol,
      tokenBSymbol,
      employeeAddress: mockUserAddress, // Use mock user address instead of selectedEmployee.walletAddress
      employeeName: selectedEmployee.name
    };

    if (payrollData.startTimestamp >= payrollData.endTimestamp) {
      setError('End time must be greater than start time');
      return;
    }

    if (payrollData.amountTokenAInWei <= 0n || payrollData.amountTokenBInWei <= 0n) {
      setError('Amounts must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setStatus('adding-liquidity');
    setPaymentId(null);

    try {
      // Log initial state with stored token symbols
      console.log('=== Starting Payroll Creation Process ===');
      const inputParams = {
        employee: {
          name: payrollData.employeeName,
          address: payrollData.employeeAddress
        },
        startTime: new Date(Number(payrollData.startTimestamp) * 1000).toISOString(),
        endTime: new Date(Number(payrollData.endTimestamp) * 1000).toISOString(),
        tokenAAmount: payrollData.amountTokenAInWei.toString(),
        tokenBAmount: payrollData.amountTokenBInWei.toString(),
        companyAddress: userAddress,
        poolAddress: POOL_ADDRESS,
        tokenASymbol: payrollData.tokenASymbol,
        tokenBSymbol: payrollData.tokenBSymbol
      };
      console.log('Input Parameters:', inputParams);

      // Step 1: Add Liquidity
      console.log('Step 1: Adding Liquidity...');
      console.log('Liquidity Parameters:', {
        companyAddress: userAddress,
        poolAddress: POOL_ADDRESS,
        amountA: payrollData.amountTokenAInWei.toString(),
        amountB: payrollData.amountTokenBInWei.toString(),
        tokenASymbol: payrollData.tokenASymbol,
        tokenBSymbol: payrollData.tokenBSymbol
      });

      const { receipt: liquidityReceipt, positionIndex } = await addLiquidity(
        userAddress as `0x${string}`,
        POOL_ADDRESS as `0x${string}`,
        payrollData.amountTokenAInWei,
        payrollData.amountTokenBInWei
      );

      if (!liquidityReceipt) {
        throw new Error('No receipt received from addLiquidity transaction');
      }

      console.log('Liquidity transaction receipt received:', liquidityReceipt);
      console.log('Position index received:', positionIndex.toString());

      // Log liquidity success
      console.log('Liquidity Added Successfully:', {
        receipt: liquidityReceipt,
        positionIndex: positionIndex.toString(),
        tokenAAmount: payrollData.amountTokenAInWei.toString(),
        tokenBAmount: payrollData.amountTokenBInWei.toString(),
        tokenASymbol: payrollData.tokenASymbol,
        tokenBSymbol: payrollData.tokenBSymbol
      });

      // Step 2: Create Payroll
      console.log('Step 2: Creating Payroll...');
      setStatus('creating-payroll');
      
      // Usar el hook para obtener el siguiente ID
      const payrollId = getNextId();

      const receipt = await createPayroll(
        payrollId,
        userAddress as `0x${string}`,
        positionIndex,
        [payrollData.employeeAddress],
        [payrollData.amountTokenAInWei, payrollData.amountTokenBInWei],
        payrollData.startTimestamp,
        payrollData.endTimestamp
      );

      if (!receipt) {
        throw new Error('No receipt received from createPayroll transaction');
      }

      console.log('Payroll transaction receipt received:', receipt);

      // Log payroll creation success
      console.log('Payroll Created Successfully:', {
        payrollId: payrollId.toString(),
        receipt,
        positionIndex: positionIndex.toString(),
        beneficiary: payrollData.employeeAddress,
        amounts: {
          tokenA: {
            amount: payrollData.amountTokenAInWei.toString(),
            symbol: payrollData.tokenASymbol
          },
          tokenB: {
            amount: payrollData.amountTokenBInWei.toString(),
            symbol: payrollData.tokenBSymbol
          }
        },
        vestingSchedule: {
          startTime: new Date(Number(payrollData.startTimestamp) * 1000).toISOString(),
          endTime: new Date(Number(payrollData.endTimestamp) * 1000).toISOString()
        }
      });

      // Log final state
      console.log('=== Payroll Creation Complete ===');
      console.log('Final State:', {
        payrollId: payrollId.toString(),
        positionIndex: positionIndex.toString(),
        liquidityReceipt,
        payrollReceipt: receipt,
        beneficiary: {
          address: payrollData.employeeAddress,
          name: payrollData.employeeName
        },
        amounts: {
          tokenA: {
            amount: payrollData.amountTokenAInWei.toString(),
            symbol: payrollData.tokenASymbol
          },
          tokenB: {
            amount: payrollData.amountTokenBInWei.toString(),
            symbol: payrollData.tokenBSymbol
          }
        },
        vestingSchedule: {
          startTime: new Date(Number(payrollData.startTimestamp) * 1000).toISOString(),
          endTime: new Date(Number(payrollData.endTimestamp) * 1000).toISOString(),
          duration: `${(Number(payrollData.endTimestamp) - Number(payrollData.startTimestamp)) / (24 * 60 * 60)} days`
        }
      });

      // Update UI state
      setPaymentId(payrollId);
      onPayrollCreated();
      await refetchPayrolls();

    } catch (error) {
      console.error('Error in payroll creation process:', error);
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          setError('Insufficient funds for transaction. Please check your token balances.');
        } else if (error.message.includes('user rejected')) {
          setError('Transaction was rejected. Please try again.');
        } else if (error.message.includes('gas required exceeds allowance')) {
          setError('Insufficient gas for transaction. Please try with higher gas limit.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Failed to create payroll. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setStatus('idle');
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
          <div style={{ padding: spacing.xl, overflowY: 'auto' }}>
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
                      // Buscar el empleado en todos los equipos
                      let foundEmployee: Employee | null = null;
                      for (const team of teams) {
                        const employee = team.members.find(m => m.walletAddress === e.target.value);
                        if (employee) {
                          foundEmployee = employee;
                          break;
                        }
                      }
                      setSelectedEmployee(foundEmployee || null);
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
                    {/* Mostrar todos los empleados sin duplicados */}
                    {Array.from(new Set(teams.flatMap(team => team.members)))
                      .map(employee => (
                        <option 
                          key={employee.walletAddress} 
                          value={employee.walletAddress}
                        >
                          {employee.name}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}

              {/* Token Amounts Section */}
              <div style={{ marginBottom: spacing.lg }}>
                <label style={{
                  display: 'block',
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                  marginBottom: spacing.xs
                }}>
                  Payment Amounts
                </label>
                <div style={{ display: 'flex', gap: spacing.md }}>
                  {/* Amount Token A */}
                  <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <DollarSign size={16} style={{ position: 'absolute', left: spacing.sm, color: colors.text.secondary }} />
                      <input
                        type="number"
                        value={amountTokenA}
                        onChange={(e) => setAmountTokenA(e.target.value)}
                        style={{ width: '100%', padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: typography.fontSize.sm, backgroundColor: 'white' }}
                        placeholder={`Amount ${tokenAInfo || 'Token A'}`}
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 }}>
                      Balance: {balanceQueryA.isLoading ? '...' : formattedBalances.tokenA} {tokenAInfo?.toString() || ''}
                    </div>
                  </div>

                  {/* Amount Token B */}
                  <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <DollarSign size={16} style={{ position: 'absolute', left: spacing.sm, color: colors.text.secondary }} />
                      <input
                        type="number"
                        value={amountTokenB}
                        onChange={(e) => setAmountTokenB(e.target.value)}
                        style={{ width: '100%', padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: typography.fontSize.sm, backgroundColor: 'white' }}
                        placeholder={`Amount ${tokenBInfo || 'Token B'}`}
                        min="0"
                        step="0.01"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 }}>
                      Balance: {balanceQueryB.isLoading ? '...' : formattedBalances.tokenB} {tokenBInfo?.toString() || ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Start Unix Timestamp */}
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <label style={{ 
                    fontSize: typography.fontSize.sm, 
                    fontWeight: typography.fontWeight.medium, 
                    color: colors.text.primary 
                  }}>
                    Start Unix Timestamp (segundos)
                  </label>
                  <button
                    type="button"
                    onClick={() => setStartUnix(getCurrentTimestamp())}
                    style={{
                      backgroundColor: colors.light,
                      border: 'none',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: '6px',
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}
                    disabled={isSubmitting}
                  >
                    <Calendar size={14} />
                    Use Current Time
                  </button>
                </div>
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
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 }}>
                  {new Date(Number(startUnix) * 1000).toLocaleString()}
                </div>
              </div>

              {/* End Unix Timestamp */}
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
                  <label style={{ 
                    fontSize: typography.fontSize.sm, 
                    fontWeight: typography.fontWeight.medium, 
                    color: colors.text.primary 
                  }}>
                    End Unix Timestamp (segundos)
                  </label>
                  <button
                    type="button"
                    onClick={() => setEndUnix((Number(getCurrentTimestamp()) + 30 * 24 * 60 * 60).toString())}
                    style={{
                      backgroundColor: colors.light,
                      border: 'none',
                      padding: `${spacing.xs} ${spacing.sm}`,
                      borderRadius: '6px',
                      fontSize: typography.fontSize.xs,
                      color: colors.text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.xs
                    }}
                    disabled={isSubmitting}
                  >
                    <Calendar size={14} />
                    Set 30 Days
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: spacing.sm, color: colors.text.secondary }} />
                  <input
                    type="number"
                    value={endUnix}
                    onChange={(e) => setEndUnix(e.target.value)}
                    style={{ width: '100%', padding: `${spacing.sm} ${spacing.sm} ${spacing.sm} ${spacing.xl}`, border: `1px solid ${colors.border}`, borderRadius: '8px', fontSize: typography.fontSize.sm, backgroundColor: 'white' }}
                    placeholder="ej. 1710000000"
                    min="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary, marginTop: 2 }}>
                  {new Date(Number(endUnix) * 1000).toLocaleString()}
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
                justifyContent: 'flex-end',
                flexDirection: 'column',
                alignItems: 'flex-end'
              }}>
                {paymentId && (
                  <div style={{
                    backgroundColor: colors.mint,
                    padding: spacing.sm,
                    borderRadius: '8px',
                    marginBottom: spacing.sm,
                    width: '100%',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      fontSize: typography.fontSize.sm,
                      color: colors.text.primary,
                      fontWeight: typography.fontWeight.medium
                    }}>
                      Payment ID: {paymentId.toString()}
                    </span>
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  gap: spacing.md,
                  justifyContent: 'flex-end',
                  width: '100%'
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
                    {paymentId ? 'Close' : 'Cancel'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedEmployee || !startUnix || !endUnix || !amountTokenA || !amountTokenB}
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
                      opacity: (!selectedEmployee || !startUnix || !endUnix || !amountTokenA || !amountTokenB) ? 0.6 : 1
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
                        {status === 'adding-liquidity' ? 'Adding Liquidity...' : 'Creating Payment...'}
                      </>
                    ) : (
                      <>
                        Send Payroll
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Recent Payrolls Section */}
              {!isSubmitting && payrolls.length > 0 && (
                <div style={{
                  width: '100%',
                  marginTop: spacing.lg,
                  paddingTop: spacing.lg,
                  borderTop: `1px solid ${colors.border}`
                }}>
                  <h3 style={{
                    fontSize: typography.fontSize.lg,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.text.primary,
                    marginBottom: spacing.md
                  }}>
                    Recent Payrolls
                  </h3>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.sm
                  }}>
                    {payrolls.map((payroll) => (
                      <div
                        key={`${payroll.payrollId}-${payroll.positionIndex}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: spacing.sm,
                          backgroundColor: colors.surface,
                          borderRadius: '8px',
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm
                        }}>
                          <span style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.primary,
                            fontFamily: 'monospace'
                          }}>
                            Payroll #{payroll.payrollId.toString()}
                          </span>
                          <span style={{
                            fontSize: typography.fontSize.xs,
                            color: colors.text.secondary,
                            fontFamily: 'monospace'
                          }}>
                            (Position #{payroll.positionIndex.toString()})
                          </span>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedPayrollInfo(payroll);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs,
                            padding: `${spacing.xs} ${spacing.sm}`,
                            backgroundColor: colors.light,
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: colors.text.secondary,
                            fontSize: typography.fontSize.xs,
                            fontWeight: typography.fontWeight.medium,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = colors.border;
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = colors.light;
                          }}
                        >
                          <Info size={14} />
                          Get Info
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payroll Info Modal */}
              {selectedPayrollInfo && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}
                onClick={() => setSelectedPayrollInfo(null)}
                >
                  <div
                    style={{
                      backgroundColor: 'white',
                      padding: spacing.xl,
                      borderRadius: '12px',
                      maxWidth: '500px',
                      width: '90%',
                      maxHeight: '90vh',
                      overflowY: 'auto'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <PayrollPositionCard
                      payrollId={selectedPayrollInfo.payrollId}
                      positionIndex={selectedPayrollInfo.positionIndex}
                      teamName="Payroll Information"
                      teamColor={colors.primary}
                    />
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePayrollPopup; 