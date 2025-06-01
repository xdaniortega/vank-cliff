import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { getContractAddress, CHAIN_IDS } from '../contracts/addresses';
import { abi } from '../contracts/CompanyLiquidityManager.json';
import { useWalletInfo } from './useWalletInfo';
import type { Abi } from 'viem';

// Types for contract responses
interface PayrollInfoResponse {
  id: bigint;
  positionIndex: bigint;
  totalAmount: bigint;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
}

interface BeneficiaryInfoResponse {
  beneficiary: `0x${string}`;
  amount: bigint;
  unlockTime: bigint;
  hasClaimed: boolean;
  rewardSnapshot: bigint;
}

interface PositionInfoResponse {
  // Add position info fields if needed
}

type PayrollCompleteInfoResponse = [
  PayrollInfoResponse,
  BeneficiaryInfoResponse[],
  PositionInfoResponse
];

export interface BeneficiaryInfo {
  beneficiary: `0x${string}`;
  amount: bigint;
  unlockTime: bigint;
  hasClaimed: boolean;
  rewardSnapshot: bigint;
}

export interface PayrollInfo {
  payrollId: bigint;
  positionIndex: bigint;
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  claimedAmount: bigint;
  isActive: boolean;
  beneficiaries: BeneficiaryInfo[];
  totalAmount: bigint;
}

// Fixed set of IDs to try
const PAYROLL_IDS_TO_TRY = [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n];

function isValidPayrollData(data: unknown): data is PayrollCompleteInfoResponse {
  if (!data) return false;
  if (!Array.isArray(data)) return false;
  if (data.length < 2) return false;
  
  const [payrollInfo, beneficiaries] = data;
  if (!payrollInfo || typeof payrollInfo !== 'object') return false;
  if (!Array.isArray(beneficiaries)) return false;
  
  return true;
}

export function useCompanyLastPayrolls(
  companyAddress: string | null | undefined, 
  { maxPayrolls = 3 } = {}
) {
  const { chainId } = useWalletInfo();

  // Get contract address
  const contractAddress = useMemo(() => {
    if (!chainId) return null;
    try {
      const numericChainId = Number(chainId);
      if (numericChainId !== CHAIN_IDS.FLOW) return null;
      return getContractAddress(numericChainId, "companyLiquidityManager");
    } catch (error) {
      console.warn("Error getting contract address:", error);
      return null;
    }
  }, [chainId]);

  // Try to get payroll info for each ID
  const payrollQueries = PAYROLL_IDS_TO_TRY.map(payrollId => {
    const { data, isLoading, error } = useReadContract({
      address: contractAddress as `0x${string}`,
      abi: abi as Abi,
      functionName: "getPayrollCompleteInfo",
      args: [payrollId, companyAddress as `0x${string}`],
      query: { enabled: !!contractAddress && !!companyAddress }
    });

    return { payrollId, data, isLoading, error };
  });

  // Process all payrolls
  const processedPayrolls = useMemo(() => {
    const validPayrolls = payrollQueries
      .filter(query => {
        if (!query.data) return false;
        
        try {
          if (!isValidPayrollData(query.data)) return false;
          
          const [payrollInfo, beneficiaries] = query.data;
          
          // Check if payroll is valid
          if (!payrollInfo?.isActive) return false;
          if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) return false;
          if (!payrollInfo.totalAmount || payrollInfo.totalAmount <= 0n) return false;
          
          return true;
        } catch (error) {
          console.error(`Error validating payroll ${query.payrollId}:`, error);
          return false;
        }
      })
      .map(query => {
        try {
          if (!query.data || !isValidPayrollData(query.data)) return null;
          
          const [payrollInfo, beneficiaries] = query.data;
          
          // Double check validity after type guard
          if (!payrollInfo?.isActive) return null;
          if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) return null;
          if (!payrollInfo.totalAmount || payrollInfo.totalAmount <= 0n) return null;
          
          const payroll: PayrollInfo = {
            payrollId: payrollInfo.id,
            positionIndex: payrollInfo.positionIndex,
            amount: payrollInfo.totalAmount,
            startTime: payrollInfo.startTime,
            endTime: payrollInfo.endTime,
            claimedAmount: 0n,
            isActive: payrollInfo.isActive,
            totalAmount: payrollInfo.totalAmount,
            beneficiaries: beneficiaries.map(b => ({
              beneficiary: b.beneficiary,
              amount: b.amount,
              unlockTime: b.unlockTime,
              hasClaimed: b.hasClaimed,
              rewardSnapshot: b.rewardSnapshot
            }))
          };

          // Calculate total claimed amount
          payroll.claimedAmount = payroll.beneficiaries.reduce(
            (acc, b) => acc + (b.hasClaimed ? b.amount : 0n),
            0n
          );

          return payroll;
        } catch (error) {
          console.error(`Error creating payroll object for ${query.payrollId}:`, error);
          return null;
        }
      })
      .filter((payroll): payroll is PayrollInfo => payroll !== null)
      .sort((a, b) => Number(b.payrollId - a.payrollId))
      .slice(0, maxPayrolls);

    return validPayrolls;
  }, [payrollQueries, maxPayrolls]);

  const isLoading = payrollQueries.some(query => query.isLoading);
  const error = payrollQueries.find(query => 
    query.error && !query.error.message.includes('PayrollNotActive')
  )?.error || (!contractAddress ? new Error(`Chain ID ${chainId} not supported`) : null);

  return { 
    payrolls: processedPayrolls, 
    isLoading,
    error,
    totalPayrolls: processedPayrolls.length
  };
} 