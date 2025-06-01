import { useReadContract, useChainId, useAccount } from 'wagmi';
import { CHAIN_IDS, getContractAddress } from '../contracts/addresses';
import CompanyLiquidityManagerABI from '../contracts/CompanyLiquidityManager.json';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { getLastPayrollId } from './usePayrollId';

export interface CompanyPayroll {
  payrollId: bigint;
  positionIndex: bigint;
  startTime: bigint;
  endTime: bigint;
  amount: bigint;
  claimedAmount: bigint;
  isActive: boolean;
  pool: `0x${string}`;
  totalAmount: bigint;
  availableAmount: bigint;
  totalRewards: bigint;
  claimedRewards: bigint;
}

export const useCompanyPayrolls = (companyAddress: `0x${string}` | undefined) => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  
  const [payrolls, setPayrolls] = useState<CompanyPayroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const contractAddr = useMemo(() => 
    getContractAddress(chainId, "companyLiquidityManager"),
    [chainId]
  );

  const isEnabled = useMemo(() => 
    !!companyAddress && 
    !!contractAddr && 
    (chainId === CHAIN_IDS.FLOW || chainId === CHAIN_IDS.LOCALHOST) && 
    isConnected && 
    !!userAddress,
    [companyAddress, contractAddr, chainId, isConnected, userAddress]
  );

  const lastPayrollId = useMemo(() => 
    companyAddress ? getLastPayrollId(companyAddress) : 0n,
    [companyAddress]
  );

  // Get total positions count
  const { 
    data: totalPositionsData, 
    isLoading: isLoadingTotal,
    error: totalPositionsError 
  } = useReadContract({
    address: contractAddr as `0x${string}`,
    abi: CompanyLiquidityManagerABI.abi,
    functionName: 'companyPositionCount',
    args: [companyAddress as `0x${string}`],
    query: {
      enabled: isEnabled,
      retry: 1,
      retryDelay: 2000,
      staleTime: 30000,
      gcTime: 60000,
    }
  });

  const totalPositions = useMemo(() => 
    typeof totalPositionsData === 'bigint' ? totalPositionsData : 0n,
    [totalPositionsData]
  );

  // Get current position info
  const { 
    data: positionData,
    isLoading: isLoadingPosition,
    error: positionError
  } = useReadContract({
    address: contractAddr as `0x${string}`,
    abi: CompanyLiquidityManagerABI.abi,
    functionName: 'getPositionInfo',
    args: [companyAddress as `0x${string}`, BigInt(currentIndex)],
    query: {
      enabled: isEnabled && totalPositions > 0n && currentIndex < Number(totalPositions),
      retry: 1,
      retryDelay: 2000,
      staleTime: 30000,
      gcTime: 60000,
    }
  });

  // Get current payroll info
  const { 
    data: payrollData,
    isLoading: isLoadingPayroll,
    error: payrollError
  } = useReadContract({
    address: contractAddr as `0x${string}`,
    abi: CompanyLiquidityManagerABI.abi,
    functionName: 'getPayrollInfo',
    args: [positionData ? (positionData as [string, bigint, bigint, bigint, bigint, bigint, boolean])[1] : 0n],
    query: {
      enabled: isEnabled && !!positionData,
      retry: 1,
      retryDelay: 2000,
      staleTime: 30000,
      gcTime: 60000,
    }
  });

  // Get payroll receipts
  const { 
    data: receiptsData,
    isLoading: isLoadingReceipts,
    error: receiptsError
  } = useReadContract({
    address: contractAddr as `0x${string}`,
    abi: CompanyLiquidityManagerABI.abi,
    functionName: 'getPayrollReceipts',
    args: [positionData ? (positionData as [string, bigint, bigint, bigint, bigint, bigint, boolean])[1] : 0n],
    query: {
      enabled: isEnabled && !!positionData,
      retry: 1,
      retryDelay: 2000,
      staleTime: 30000,
      gcTime: 60000,
    }
  });

  const refetch = useCallback(() => {
    if (!isEnabled) return;
    setCurrentIndex(0);
    setPayrolls([]);
    setIsLoading(true);
  }, [isEnabled]);

  // Process position and payroll data
  useEffect(() => {
    if (!isEnabled) {
      setPayrolls([]);
      setError('Please connect your wallet and ensure you are on the Flow network');
      setIsLoading(false);
      return;
    }

    if (totalPositionsError) {
      setError(totalPositionsError.message);
      setIsLoading(false);
      return;
    }

    if (!isLoadingTotal && !isLoadingPosition && !isLoadingPayroll) {
      if (positionData && payrollData) {
        try {
          const [
            pool,
            positionId,
            totalAmount,
            availableAmount,
            totalRewards,
            claimedRewards,
            isActive
          ] = positionData as [string, bigint, bigint, bigint, bigint, bigint, boolean];

          const [
            _positionIndex,
            _amount,
            startTime,
            endTime,
            _claimedAmount,
            _isActive
          ] = payrollData as [bigint, bigint, bigint, bigint, bigint, boolean];

          const payrollId = lastPayrollId !== undefined && BigInt(currentIndex + 1) <= lastPayrollId 
            ? BigInt(currentIndex + 1) 
            : positionId;

          setPayrolls(prev => {
            const newPayrolls = [...prev];
            
            const payrollIndex = newPayrolls.findIndex(p => p.payrollId === payrollId);
            const newPayroll = {
              payrollId,
              positionIndex: BigInt(currentIndex),
              startTime,
              endTime,
              amount: totalAmount,
              claimedAmount: claimedRewards,
              isActive,
              pool: pool as `0x${string}`,
              totalAmount,
              availableAmount,
              totalRewards,
              claimedRewards
            };

            if (payrollIndex >= 0) {
              newPayrolls[payrollIndex] = newPayroll;
            } else {
              newPayrolls.push(newPayroll);
            }

            return newPayrolls.sort((a, b) => {
              const idDiff = Number(b.payrollId - a.payrollId);
              if (idDiff !== 0) return idDiff;
              
              return Number(b.startTime - a.startTime);
            });
          });

          if (currentIndex + 1 < Number(totalPositions)) {
            setCurrentIndex(prev => prev + 1);
          } else {
            setIsLoading(false);
            setError(null);
          }
        } catch (error) {
          console.error('Error processing payroll data:', error);
          setError(error instanceof Error ? error.message : 'Error processing payroll data');
          setIsLoading(false);
        }
      } else if (positionError || payrollError) {
        setError(positionError?.message || payrollError?.message || 'Error fetching payroll data');
        setIsLoading(false);
      } else if (currentIndex >= Number(totalPositions)) {
        setIsLoading(false);
      }
    }
  }, [
    isEnabled,
    isLoadingTotal,
    isLoadingPosition,
    isLoadingPayroll,
    positionData,
    payrollData,
    totalPositions,
    currentIndex,
    positionError,
    payrollError,
    totalPositionsError,
    lastPayrollId
  ]);

  if (!isEnabled) {
    return {
      payrolls: [],
      allPayrolls: [],
      isLoading: false,
      error: 'Please connect your wallet and ensure you are on the Flow network',
      refetch: () => {}
    };
  }

  if (isLoading || !totalPositions || totalPositions === 0n) {
    return {
      payrolls: [],
      allPayrolls: [],
      isLoading: true,
      error: null,
      refetch
    };
  }

  return {
    payrolls: payrolls.slice(0, 3),
    allPayrolls: payrolls,
    isLoading,
    error,
    refetch
  };
}; 