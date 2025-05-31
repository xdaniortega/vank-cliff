import { useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CompanyLiquidityManager } from '../typechain-types';

export const usePayrollContract = () => {
  const { address: companyAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { waitForTransactionReceiptAsync } = useWaitForTransactionReceipt();

  const addLiquidity = useCallback(async (
    poolAddress: `0x${string}`,
    amount0: bigint,
    amount1: bigint
  ) => {
    if (!companyAddress) throw new Error('Wallet not connected');
    
    const contractAddress = process.env.NEXT_PUBLIC_COMPANY_LIQUIDITY_MANAGER_ADDRESS as `0x${string}`;
    if (!contractAddress) throw new Error('Contract address not configured');

    const tx = await writeContractAsync({
      address: contractAddress,
      abi: CompanyLiquidityManager.abi,
      functionName: 'addLiquidityPosition',
      args: [
        companyAddress,
        poolAddress,
        amount0,
        amount1
      ]
    });

    return waitForTransactionReceiptAsync({ hash: tx });
  }, [companyAddress, writeContractAsync, waitForTransactionReceiptAsync]);

  const createPayroll = useCallback(async (
    payrollId: bigint,
    positionIndex: bigint,
    beneficiaries: `0x${string}`[],
    amounts: bigint[],
    startTime: bigint,
    endTime: bigint
  ) => {
    if (!companyAddress) throw new Error('Wallet not connected');
    
    const contractAddress = process.env.NEXT_PUBLIC_COMPANY_LIQUIDITY_MANAGER_ADDRESS as `0x${string}`;
    if (!contractAddress) throw new Error('Contract address not configured');

    const tx = await writeContractAsync({
      address: contractAddress,
      abi: CompanyLiquidityManager.abi,
      functionName: 'createPayrollMulti',
      args: [
        payrollId,
        companyAddress,
        positionIndex,
        beneficiaries,
        amounts,
        startTime,
        endTime
      ]
    });

    return waitForTransactionReceiptAsync({ hash: tx });
  }, [companyAddress, writeContractAsync, waitForTransactionReceiptAsync]);

  return {
    addLiquidity,
    createPayroll
  };
}; 