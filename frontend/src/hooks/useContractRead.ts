import { useCallback } from 'react';
import { useReadContract } from 'wagmi';
import { CHAIN_IDS, getContractAddress } from '../contracts/addresses';
import CompanyLiquidityManagerABI from '../contracts/CompanyLiquidityManager.json';
import MockTokenABI from '../contracts/MockToken.json';
import MockLiquidityPoolABI from '../contracts/MockLiquidityPool.json';
import type { LiquidityPosition, Payroll, PayrollClaim, TokenInfo, PoolInfo } from '../contracts/types';

export const useContractRead = (chainId: number = CHAIN_IDS.FLOW) => {
  const { data: liquidityManagerContract } = useReadContract({
    address: getContractAddress(chainId, 'companyLiquidityManager'),
    abi: CompanyLiquidityManagerABI.abi
  });

  const { data: mockDAIContract } = useReadContract({
    address: getContractAddress(chainId, 'mockDAI'),
    abi: MockTokenABI.abi
  });

  const { data: mockTokenContract } = useReadContract({
    address: getContractAddress(chainId, 'mockToken'),
    abi: MockTokenABI.abi
  });

  const { data: mockPoolContract } = useReadContract({
    address: getContractAddress(chainId, 'mockPool'),
    abi: MockLiquidityPoolABI.abi
  });

  const getLiquidityPosition = useCallback(async (
    companyAddress: `0x${string}`,
    positionIndex: bigint
  ): Promise<LiquidityPosition | null> => {
    if (!liquidityManagerContract) return null;

    try {
      const position = await liquidityManagerContract.read.getLiquidityPosition([
        companyAddress,
        positionIndex
      ]);

      return {
        company: position[0],
        pool: position[1],
        amount0: position[2],
        amount1: position[3],
        availableAmount0: position[4],
        availableAmount1: position[5],
        isActive: position[6]
      };
    } catch (error) {
      console.error('Error getting liquidity position:', error);
      return null;
    }
  }, [liquidityManagerContract]);

  const getPayroll = useCallback(async (
    payrollId: bigint
  ): Promise<Payroll | null> => {
    if (!liquidityManagerContract) return null;

    try {
      const payroll = await liquidityManagerContract.read.getPayroll([payrollId]);

      return {
        id: payroll[0],
        company: payroll[1],
        positionIndex: payroll[2],
        beneficiaries: payroll[3],
        amounts: payroll[4],
        startTime: payroll[5],
        endTime: payroll[6],
        isActive: payroll[7]
      };
    } catch (error) {
      console.error('Error getting payroll:', error);
      return null;
    }
  }, [liquidityManagerContract]);

  const getPayrollClaim = useCallback(async (
    payrollId: bigint,
    beneficiary: `0x${string}`
  ): Promise<PayrollClaim | null> => {
    if (!liquidityManagerContract) return null;

    try {
      const claim = await liquidityManagerContract.read.getPayrollClaim([
        payrollId,
        beneficiary
      ]);

      return {
        payrollId: claim[0],
        beneficiary: claim[1],
        amount: claim[2],
        claimed: claim[3]
      };
    } catch (error) {
      console.error('Error getting payroll claim:', error);
      return null;
    }
  }, [liquidityManagerContract]);

  const getTokenInfo = useCallback(async (
    tokenAddress: `0x${string}`,
    accountAddress?: `0x${string}`
  ): Promise<TokenInfo | null> => {
    const contract = tokenAddress === getContractAddress(chainId, 'mockDAI') 
      ? mockDAIContract 
      : mockTokenContract;

    if (!contract) return null;

    try {
      const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
        contract.read.name(),
        contract.read.symbol(),
        contract.read.decimals(),
        contract.read.totalSupply(),
        accountAddress ? contract.read.balanceOf([accountAddress]) : 0n
      ]);

      return {
        address: tokenAddress,
        name,
        symbol,
        decimals,
        totalSupply,
        balance
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }, [chainId, mockDAIContract, mockTokenContract]);

  const getPoolInfo = useCallback(async (
    accountAddress?: `0x${string}`
  ): Promise<PoolInfo | null> => {
    if (!mockPoolContract) return null;

    try {
      const [token0, token1, reserve0, reserve1, totalSupply, balance] = await Promise.all([
        mockPoolContract.read.token0(),
        mockPoolContract.read.token1(),
        mockPoolContract.read.reserve0(),
        mockPoolContract.read.reserve1(),
        mockPoolContract.read.totalSupply(),
        accountAddress ? mockPoolContract.read.balanceOf([accountAddress]) : 0n
      ]);

      return {
        address: getContractAddress(chainId, 'mockPool'),
        token0,
        token1,
        reserve0,
        reserve1,
        totalSupply,
        balance
      };
    } catch (error) {
      console.error('Error getting pool info:', error);
      return null;
    }
  }, [chainId, mockPoolContract]);

  return {
    getLiquidityPosition,
    getPayroll,
    getPayrollClaim,
    getTokenInfo,
    getPoolInfo
  };
}; 