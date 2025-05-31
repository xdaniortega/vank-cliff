import { useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from 'wagmi';
import { CHAIN_IDS, getContractAddress } from '../contracts/addresses';
import CompanyLiquidityManagerABI from '../contracts/CompanyLiquidityManager.json';

export const usePayrollContract = () => {
  const { writeContractAsync, isPending } = useWriteContract();
  const addLiquidity = useCallback(async (companyAddr: `0x${string}`, poolAddr: `0x${string}`, amountA: bigint, amountB: bigint) => {
    const contractAddr = getContractAddress(CHAIN_IDS.FLOW, "companyLiquidityManager");
    const receipt = await writeContractAsync({ abi: CompanyLiquidityManagerABI.abi, address: contractAddr, functionName: "addLiquidity", args: [companyAddr, poolAddr, amountA, amountB] });
    return receipt;
  }, [writeContractAsync]);
  const createPayroll = useCallback(async (payrollId: bigint, positionIndex: bigint, beneficiaries: Array<`0x${string}`>, amounts: bigint[], startTime: bigint, endTime: bigint) => {
    const contractAddr = getContractAddress(CHAIN_IDS.FLOW, "companyLiquidityManager");
    const receipt = await writeContractAsync({ abi: CompanyLiquidityManagerABI.abi, address: contractAddr, functionName: "createPayroll", args: [payrollId, positionIndex, beneficiaries, amounts, startTime, endTime] });
    return receipt;
  }, [writeContractAsync]);
  return { isPending, addLiquidity, createPayroll };
}; 