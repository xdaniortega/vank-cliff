import { useReadContract } from 'wagmi';
import { CHAIN_IDS, getContractAddress } from '../contracts/addresses';
import CompanyLiquidityManagerABI from '../contracts/CompanyLiquidityManager.json';

export interface PayrollInfo {
  payrollId: bigint;
  positionIndex: bigint;
  amount: bigint;
  startTime: bigint;
  endTime: bigint;
  claimedAmount: bigint;
  isActive: boolean;
  totalRewards: bigint;
  claimedRewards: bigint;
}

export const usePayrollInfo = (payrollId: bigint, positionIndex: bigint) => {
  const contractAddr = getContractAddress(CHAIN_IDS.FLOW, "companyLiquidityManager");

  const { data: payrollData, isLoading } = useReadContract({
    address: contractAddr,
    abi: CompanyLiquidityManagerABI.abi,
    functionName: 'getPayrollInfo',
    args: [payrollId],
  });

  const { data: rewardsData } = useReadContract({
    address: contractAddr,
    abi: CompanyLiquidityManagerABI.abi,
    functionName: 'getPayrollRewards',
    args: [payrollId, positionIndex],
  });

  if (!payrollData || !rewardsData) {
    return { payrollInfo: null, isLoading };
  }

  const [positionIndex_, amount, startTime, endTime, claimedAmount, isActive] = payrollData as [bigint, bigint, bigint, bigint, bigint, boolean];
  const [totalRewards, claimedRewards] = rewardsData as [bigint, bigint];

  const payrollInfo: PayrollInfo = {
    payrollId,
    positionIndex: positionIndex_,
    amount,
    startTime,
    endTime,
    claimedAmount,
    isActive,
    totalRewards,
    claimedRewards
  };

  return { payrollInfo, isLoading };
}; 