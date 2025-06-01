import { useCallback } from 'react';
import { useWriteContract, usePublicClient } from 'wagmi';
import { CHAIN_IDS, getContractAddress } from '../contracts/addresses';
import CompanyLiquidityManagerABI from '../contracts/CompanyLiquidityManager.json';
import MockTokenABI from '../contracts/MockToken.json';
import MockLiquidityPoolABI from '../contracts/MockLiquidityPool.json';
import { useWalletInfo } from './useWalletInfo';

export const usePayrollContract = () => {
  const { writeContractAsync, isPending } = useWriteContract();
  const { address: userAddress, isConnected } = useWalletInfo();
  const publicClient = usePublicClient();

  const addLiquidity = useCallback(async (
    companyAddr: `0x${string}`, 
    poolAddr: `0x${string}`, 
    amountA: bigint, 
    amountB: bigint
  ) => {
    console.log('Starting addLiquidity process...', {
      companyAddr,
      poolAddr,
      amountA: amountA.toString(),
      amountB: amountB.toString()
    });

    if (!isConnected || !userAddress) throw new Error("Please connect your wallet to add liquidity");
    if (!publicClient) throw new Error("Public client not available");
    
    const contractAddr = getContractAddress(CHAIN_IDS.FLOW, "companyLiquidityManager");
    console.log('Using contract address:', contractAddr);
    
    try {
      // Get current position count before adding liquidity
      console.log('Getting current position count...');
      const currentPositionCount = await publicClient.readContract({
        abi: CompanyLiquidityManagerABI.abi,
        address: contractAddr,
        functionName: "companyPositionCount",
        args: [companyAddr]
      }) as bigint;
      
      console.log('Current position count:', currentPositionCount.toString());

      // Get token addresses from the pool using publicClient
      console.log('Getting token addresses from pool...');
      const token0Address = await publicClient.readContract({
        abi: MockLiquidityPoolABI.abi,
        address: poolAddr,
        functionName: "token0",
      }) as `0x${string}`;
      
      const token1Address = await publicClient.readContract({
        abi: MockLiquidityPoolABI.abi,
        address: poolAddr,
        functionName: "token1",
      }) as `0x${string}`;

      console.log('Token addresses retrieved:', {
        token0Address,
        token1Address
      });

      if (!token0Address || !token1Address) {
        throw new Error("Failed to get token addresses from pool");
      }

      // Approve token0
      console.log('Approving token0...', {
        tokenAddress: token0Address,
        spender: contractAddr,
        amount: amountA.toString()
      });
      const approve0Receipt = await writeContractAsync({
        abi: MockTokenABI.abi,
        address: token0Address,
        functionName: "approve",
        args: [contractAddr, amountA]
      });
      console.log('Token0 approval receipt:', approve0Receipt);

      // Approve token1
      console.log('Approving token1...', {
        tokenAddress: token1Address,
        spender: contractAddr,
        amount: amountB.toString()
      });
      const approve1Receipt = await writeContractAsync({
        abi: MockTokenABI.abi,
        address: token1Address,
        functionName: "approve",
        args: [contractAddr, amountB]
      });
      console.log('Token1 approval receipt:', approve1Receipt);

      // Add liquidity
      console.log('Adding liquidity...', {
        contractAddr,
        companyAddr,
        poolAddr,
        amountA: amountA.toString(),
        amountB: amountB.toString()
      });
      const receipt = await writeContractAsync({ 
        abi: CompanyLiquidityManagerABI.abi, 
        address: contractAddr, 
        functionName: "addLiquidityPosition", 
        args: [companyAddr, poolAddr, amountA, amountB] 
      });
      console.log('Liquidity transaction sent:', receipt);

      // Wait for transaction to be mined
      console.log('Waiting for transaction receipt...');
      const txReceipt = await publicClient.waitForTransactionReceipt({ hash: receipt });
      console.log('Transaction mined:', txReceipt);

      // Get the new position count after adding liquidity
      console.log('Getting new position count...');
      const newPositionCount = await publicClient.readContract({
        abi: CompanyLiquidityManagerABI.abi,
        address: contractAddr,
        functionName: "companyPositionCount",
        args: [companyAddr]
      }) as bigint;
      
      console.log('New position count:', newPositionCount.toString());

      if (newPositionCount <= currentPositionCount) {
        throw new Error("Position count did not increase after adding liquidity");
      }

      // The new position index will be the previous count
      const positionIndex = currentPositionCount;
      console.log('New position index:', positionIndex.toString());

      // Verify the position exists
      console.log('Verifying position info...');
      const positionInfo = await publicClient.readContract({
        abi: CompanyLiquidityManagerABI.abi,
        address: contractAddr,
        functionName: "getPositionInfo",
        args: [companyAddr, positionIndex]
      });

      console.log('Position info retrieved:', positionInfo);

      if (!positionInfo) {
        throw new Error("Failed to get position info");
      }

      console.log('addLiquidity process completed successfully');
      return { receipt, positionIndex };
    } catch (error) {
      console.error('Error in addLiquidity:', error);
      if (error instanceof Error) {
        // Add more context to the error message
        if (error.message.includes('insufficient funds')) {
          throw new Error(`Insufficient funds for transaction: ${error.message}`);
        } else if (error.message.includes('user rejected')) {
          throw new Error(`Transaction rejected by user: ${error.message}`);
        } else if (error.message.includes('gas required exceeds allowance')) {
          throw new Error(`Gas limit too low: ${error.message}`);
        }
      }
      throw error;
    }
  }, [writeContractAsync, userAddress, isConnected, publicClient]);

  const createPayroll = useCallback(async (
    payrollId: bigint,
    companyAddr: `0x${string}`,
    positionIndex: bigint,
    beneficiaries: Array<`0x${string}`>,
    amounts: bigint[],
    startTime: bigint,
    endTime: bigint
  ) => {
    if (!isConnected || !userAddress) throw new Error("Please connect your wallet to create payroll");
    if (!publicClient) throw new Error("Public client not available");
    
    const contractAddr = getContractAddress(CHAIN_IDS.FLOW, "companyLiquidityManager");
    
    const receipt = await writeContractAsync({ 
      abi: CompanyLiquidityManagerABI.abi, 
      address: contractAddr, 
      functionName: "createPayrollMulti", 
      args: [
        payrollId,
        companyAddr,
        positionIndex,
        beneficiaries,
        amounts,
        startTime,
        endTime
      ] 
    });

    // Wait for transaction to be mined
    await publicClient.waitForTransactionReceipt({ hash: receipt });

    return receipt;
  }, [writeContractAsync, userAddress, isConnected, publicClient]);

  const createPayrollWithLiquidity = useCallback(async (
    companyAddr: `0x${string}`,
    poolAddr: `0x${string}`,
    amountA: bigint,
    amountB: bigint,
    payrollId: bigint,
    beneficiaries: Array<`0x${string}`>,
    amounts: bigint[],
    startTime: bigint,
    endTime: bigint
  ) => {
    if (!isConnected || !userAddress) throw new Error("Please connect your wallet to create payroll with liquidity");

    // First add liquidity and get position index
    const { receipt: liquidityReceipt, positionIndex } = await addLiquidity(
      companyAddr,
      poolAddr,
      amountA,
      amountB
    );
    
    // Then create the payroll with the position index
    const payrollReceipt = await createPayroll(
      payrollId,
      companyAddr,
      positionIndex,
      beneficiaries,
      amounts,
      startTime,
      endTime
    );

    return { liquidityReceipt, payrollReceipt, positionIndex };
  }, [userAddress, isConnected, addLiquidity, createPayroll]);

  return { isPending, addLiquidity, createPayroll, createPayrollWithLiquidity };
}; 