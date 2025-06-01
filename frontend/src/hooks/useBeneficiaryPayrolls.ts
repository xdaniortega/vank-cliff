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

type PayrollCompleteInfoResponse = [
  PayrollInfoResponse,
  BeneficiaryInfoResponse[],
  any // PositionInfoResponse
];

export interface BeneficiaryPayrollInfo {
  payrollId: bigint;
  companyAddress: `0x${string}`;
  amount: bigint;
  unlockTime: bigint;
  hasClaimed: boolean;
  isActive: boolean;
  startTime: bigint;
  endTime: bigint;
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

export function useBeneficiaryPayrolls(
  beneficiaryAddress: string | null | undefined,
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

  // Try to get payroll info for each ID and company
  const payrollQueries = PAYROLL_IDS_TO_TRY.flatMap(payrollId => {
    // For each payroll ID, we need to try different company addresses
    // For now, we'll just try the contract address itself as a company
    const companyAddress = contractAddress as `0x${string}`;
    
    const { data, isLoading, error } = useReadContract({
      address: contractAddress as `0x${string}`,
      abi: abi as Abi,
      functionName: "getPayrollCompleteInfo",
      args: [payrollId, companyAddress],
      query: { enabled: !!contractAddress && !!beneficiaryAddress }
    });

    return { payrollId, companyAddress, data, isLoading, error };
  });

  // Process all payrolls
  const processedPayrolls = useMemo(() => {
    if (!beneficiaryAddress) return [];

    const validPayrolls = payrollQueries
      .filter(query => {
        if (!query.data) return false;
        
        try {
          if (!isValidPayrollData(query.data)) return false;
          
          const [payrollInfo, beneficiaries] = query.data;
          
          // Check if payroll is valid and user is a beneficiary
          if (!payrollInfo?.isActive) return false;
          if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) return false;
          
          // Check if user is a beneficiary
          const isBeneficiary = beneficiaries.some(b => 
            b.beneficiary.toLowerCase() === beneficiaryAddress.toLowerCase()
          );
          
          if (!isBeneficiary) return false;
          
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
          
          // Find the beneficiary info for the user
          const beneficiaryInfo = beneficiaries.find(b => 
            b.beneficiary.toLowerCase() === beneficiaryAddress.toLowerCase()
          );
          
          if (!beneficiaryInfo) return null;
          
          const payroll: BeneficiaryPayrollInfo = {
            payrollId: payrollInfo.id,
            companyAddress: query.companyAddress,
            amount: beneficiaryInfo.amount,
            unlockTime: beneficiaryInfo.unlockTime,
            hasClaimed: beneficiaryInfo.hasClaimed,
            isActive: payrollInfo.isActive,
            startTime: payrollInfo.startTime,
            endTime: payrollInfo.endTime
          };

          return payroll;
        } catch (error) {
          console.error(`Error creating payroll object for ${query.payrollId}:`, error);
          return null;
        }
      })
      .filter((payroll): payroll is BeneficiaryPayrollInfo => payroll !== null)
      .sort((a, b) => Number(b.payrollId - a.payrollId))
      .slice(0, maxPayrolls);

    return validPayrolls;
  }, [payrollQueries, beneficiaryAddress, maxPayrolls]);

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