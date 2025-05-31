import { Address } from 'viem';

export interface LiquidityPosition {
  company: Address;
  pool: Address;
  amount0: bigint;
  amount1: bigint;
  availableAmount0: bigint;
  availableAmount1: bigint;
  isActive: boolean;
}

export interface Payroll {
  id: bigint;
  company: Address;
  positionIndex: bigint;
  beneficiaries: Address[];
  amounts: bigint[];
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
}

export interface PayrollClaim {
  payrollId: bigint;
  beneficiary: Address;
  amount: bigint;
  claimed: boolean;
}

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
  balance: bigint;
}

export interface PoolInfo {
  address: Address;
  token0: Address;
  token1: Address;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
  balance: bigint;
} 