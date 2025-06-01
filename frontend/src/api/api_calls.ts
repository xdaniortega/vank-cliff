// Centralized API calls for the application
// All fake API calls are organized here for easy replacement with real implementations

import { 
  fetchAccountBalance, 
  convertNativeTokenToUsd,
  getChainConfig,
  fetchLatestBlockNumber,
  fetchBlockscoutMeritUser,
  fetchBlockscoutMeritLeaderboard,
  distributeBlockscoutMerits,
  getBlockscoutMeritAuthNonce,
  loginBlockscoutMeritUser,
  fetchBlockscoutMeritUserBalances,
  fetchBlockscoutMeritUserLogs,
  BlockscoutMeritUser,
  BlockscoutMeritLeaderboard,
  BlockscoutMeritActivityLog
} from './blockscout-api';

import { getContract } from 'viem';
import { getPublicClient } from 'wagmi/actions';
import { usePayrollContract } from '../hooks/usePayrollContract';
import { useWalletInfo } from '../hooks/useWalletInfo';
import { erc20Abi } from '../contracts/erc20Abi';
import { CONTRACT_ADDRESSES, CHAIN_IDS } from '../contracts/addresses';
import { convertTokenToUsdWithFallback } from './price-api';
import { wagmiConfig } from '@/app/layout';

// Types and Interfaces
export interface Employee {
  id: string;
  name: string;
  salary: number;
  walletAddress: string;
  teamId: string;
}

export interface Team {
  id: string;
  name: string;
  budget: number;
  color: string;
  members: Employee[];
}

export interface TeamsAndEmployeesData {
  teams: Team[];
  totalEmployees: number;
  totalTeamCosts: number;
}

export interface ClientCompanyInfo {
  companyId: string;
  companyName: string;
  companyLogo?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  industry: string;
  foundedYear: number;
  employeeCount: number;
  website: string;
  description: string;
  employmentDetails: {
    employeeId: string;
    employeeName: string;
    position: string;
    department: string;
    startDate: Date;
    employmentType: string;
    status: string;
    manager: string;
    workLocation: string;
  };
}

export interface IndividualBalance {
  amount: number;
  currency: string;
  nativeAmount?: number;
  nativeSymbol?: string;
  lastUpdated: Date;
}

export interface CreditScore {
  score: number;
  maxScore: number;
  category: string;
  lastUpdated: Date;
  extraMerits?: Merit[];
}

export interface Merit {
  id: string;
  type: 'employee_of_week';
  title: string;
  description: string;
  awardedDate: Date;
  companyAddress: string;
  blockchainTxHash?: string;
  meritValue: number; // Points added to credit score
  distributionId?: string; // Blockscout distribution ID
}

export interface EmployeeMeritGrant {
  employeeAddress: string;
  merit: Merit;
}

export interface TreasuryBalance {
  amount: number;
  currency: string;
  nativeAmount?: number;
  nativeSymbol?: string;
  lastUpdated: Date;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface DashboardData {
  dashboardStats: {
    totalUsers: number;
    activeProjects: number;
    completedTasks: number;
    revenue: string;
  };
  projects: Array<{
    id: number;
    name: string;
    status: string;
    progress: number;
  }>;
  notifications: Array<{
    id: number;
    message: string;
    time: string;
  }>;
}

export interface PortfolioData {
  value: string;
  change: string;
}

export interface AddEmployeeRequest {
  name: string;
  walletAddress: string;
  teamId: string;
  salary: number;
}

export interface CreateTeamRequest {
  name: string;
  budget: number;
  color: string;
}

export interface DeleteTeamRequest {
  teamId: string;
}

export interface NetworkInfo {
  networkName: string;
  chainId: string;
  balance: number;
  balanceSymbol: string;
  blockNumber: number | null;
  lastUpdated: Date;
}

// =============================================================================
// TREASURY & COMPANY FINANCES
// =============================================================================

/**
 * Fetches the current treasury balance for the company using Blockscout API
 * @param address - The company wallet address (optional, falls back to mock data)
 * @param chainId - The blockchain chain ID (optional, defaults to '1')
 * @returns Promise<TreasuryBalance>
 */
export const fetchTreasuryBalance = async (
  address?: string, 
  chainId: string = '1'
): Promise<TreasuryBalance> => {
  // If no address provided, return mock data
  if (!address) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          amount: 30000.00,
          currency: 'USD',
          lastUpdated: new Date()
        });
      }, 2000);
    });
  }

  try {
    // Fetch real balance from Blockscout
    const balanceData = await fetchAccountBalance(address, chainId);
    
    if (balanceData) {
      const usdAmount = await convertNativeTokenToUsd(balanceData.balance, balanceData.symbol);
      
      return {
        amount: usdAmount,
        currency: 'USD',
        nativeAmount: balanceData.balance,
        nativeSymbol: balanceData.symbol,
        lastUpdated: new Date()
      };
    } else {
      // Fallback to mock data if Blockscout call fails
      console.warn('Failed to fetch balance from Blockscout, using mock data');
      return {
        amount: 0.00,
        currency: 'USD',
        lastUpdated: new Date()
      };
    }
  } catch (error) {
    console.error('Error fetching treasury balance:', error);
    // Fallback to mock data
    return {
      amount: 0.00,
      currency: 'USD',
      lastUpdated: new Date()
    };
  }
};

// =============================================================================
// INDIVIDUAL USER FINANCES
// =============================================================================

/**
 * Fetches network information including balance and block number
 * @param networkName - The network name (e.g., 'Ethereum', 'Polygon')
 * @param address - The wallet address (optional)
 * @returns Promise<NetworkInfo>
 */
export const fetchNetworkInfo = async (
  networkName: string,
  address?: string
): Promise<NetworkInfo> => {
  // Map network names to chain IDs
  const networkToChainId: Record<string, string> = {
    'Ethereum': '1',
    'Polygon': '137',
    'Arbitrum': '42161',
    'Optimism': '10',
    'Base': '8453' // Base mainnet
  };

  const chainId = networkToChainId[networkName] || '1';

  try {
    // Fetch balance and block number in parallel
    const [balanceData, blockNumber] = await Promise.all([
      address ? fetchAccountBalance(address, chainId) : null,
      fetchLatestBlockNumber(chainId)
    ]);

    return {
      networkName,
      chainId,
      balance: balanceData?.balance || 0,
      balanceSymbol: balanceData?.symbol || 'ETH',
      blockNumber,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`Error fetching network info for ${networkName}:`, error);
    return {
      networkName,
      chainId,
      balance: 0,
      balanceSymbol: 'ETH',
      blockNumber: null,
      lastUpdated: new Date()
    };
  }
};

/**
 * Fetches individual user balance using ERC20 contracts
 * @param address - The user's wallet address (optional, falls back to mock data)
 * @param chainId - The blockchain chain ID (optional, defaults to '1')
 * @returns Promise<IndividualBalance>
 */
export const fetchIndividualBalance = async (
  address?: string, 
  chainId: string = '1'
): Promise<IndividualBalance> => {
  // If no address provided, return mock data
  if (!address) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          amount: 0.00,
          currency: 'USD',
          lastUpdated: new Date()
        });
      }, 1000);
    });
  }

  try {
    // Get token address based on chain ID
    let tokenAddress: string;
    const chainIdNum = parseInt(chainId);
    
    switch (chainIdNum) {
      case CHAIN_IDS.FLOW:
        tokenAddress = CONTRACT_ADDRESSES.flow.mockToken;
        break;
      case CHAIN_IDS.LOCALHOST:
        tokenAddress = CONTRACT_ADDRESSES.localhost.mockToken;
        break;
      default:
        throw new Error(`Chain ID ${chainId} not supported`);
    }

    // Get public client from wagmi config
    const publicClient = getPublicClient(wagmiConfig);
    if (!publicClient) {
      throw new Error('No public client available');
    }

    // Read contract data using public client with explicit types
    const [decimals, symbol, balance] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'decimals'
      }) as Promise<number>,
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'symbol'
      }) as Promise<string>,
      publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`]
      }) as Promise<bigint>
    ]);

    // Convert balance to token units (balance is bigint, decimals is number)
    const tokenAmount = Number(balance) / Math.pow(10, Number(decimals));
    
    // Convert to USD using price API (symbol is string)
    const usdAmount = await convertTokenToUsdWithFallback(tokenAmount, symbol);
    
    return {
      amount: usdAmount,
      currency: 'USD',
      nativeAmount: tokenAmount,
      nativeSymbol: symbol,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Error fetching individual balance:', error);
    // Fallback to mock data
    return {
      amount: 0.00,
      currency: 'USD',
      lastUpdated: new Date()
    };
  }
};

/**
 * Fetches enhanced credit score including Blockscout Merit integration
 * @param userAddress - The user's wallet address for merit lookup
 * @param chainId - The blockchain chain ID for merit lookup
 * @returns Promise<CreditScore>
 */
export const fetchCreditScore = async (
  userAddress?: string,
  chainId: string = '1'
): Promise<CreditScore> => {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      const baseScore = 700; // Mock credit score
      let category = '';
      
      // Fetch merits from Blockscout Merits API
      let extraMerits: Merit[] = [];
      let meritBonus = 0;
      let blockscoutMeritBonus = 0;
      
      if (userAddress) {
        try {
          // Get Blockscout Merit user info
          const blockscoutUser = await fetchBlockscoutMeritUser(userAddress);
          
          if (blockscoutUser) {
            // Calculate bonus from Blockscout merits (1 merit = 1 point towards credit score)
            const totalBalance = parseFloat(blockscoutUser.total_balance);
            blockscoutMeritBonus = isNaN(totalBalance) ? 0 : Math.floor(totalBalance);
            console.log(`🏆 Blockscout Merit bonus: ${blockscoutMeritBonus} points from ${blockscoutUser.total_balance} merits`);
          }
          
          // Also get local merits for detailed display
          extraMerits = await fetchEmployeeMerits(userAddress, chainId);
          meritBonus = extraMerits.reduce((sum, merit) => {
            const value = merit.meritValue || 0;
            return sum + (isNaN(value) ? 0 : value);
          }, 0);
        } catch (error) {
          console.error('Error fetching merits:', error);
        }
      }
      
      // Use the higher of the two merit bonuses (Blockscout or local tracking)
      const totalMeritBonus = Math.max(
        isNaN(blockscoutMeritBonus) ? 0 : blockscoutMeritBonus, 
        isNaN(meritBonus) ? 0 : meritBonus
      );
      const totalScore = baseScore + totalMeritBonus;
      
      // Ensure score is not NaN
      const finalScore = isNaN(totalScore) ? 0 : totalScore;
      
      if (finalScore >= 750) category = 'Excellent';
      else if (finalScore >= 700) category = 'Good';
      else if (finalScore >= 650) category = 'Fair';
      else if (finalScore >= 600) category = 'Poor';
      else if (finalScore > 0) category = 'Very Poor';
      else category = 'No Score';

      resolve({
        score: finalScore,
        maxScore: 800,
        category,
        lastUpdated: new Date(),
        extraMerits
      });
    }, 1200); // 1.2-second delay
  });
};

/**
 * Grants Employee of the Week merit to an employee using real Blockscout Merits API
 * @param employeeAddress - The employee's wallet address
 * @param companyAddress - The company's wallet address
 * @param chainId - The blockchain chain ID
 * @returns Promise<{ success: boolean; merit?: Merit; error?: string }>
 */
export const grantEmployeeOfWeekMerit = async (
  employeeAddress: string,
  companyAddress: string,
  chainId: string = '1'
): Promise<{ success: boolean; merit?: Merit; error?: string }> => {
  try {
    // Check if company can grant merit (global cooldown)
    const cooldownCheck = await checkMeritCooldown(companyAddress);
    if (!cooldownCheck.canGrant) {
      return {
        success: false,
        error: 'Employee of the Week merit can only be granted once every 5 seconds (testing mode). This applies to all employees.'
      };
    }

    console.log(`🏆 Granting merit to ${employeeAddress} from company ${companyAddress}...`);

    // Use Blockscout Merits API to distribute merits
    const meritAmount = '1'; // 1 merit points
    const description = `Employee of the Week award from company ${companyAddress}. Recognized for outstanding performance and contribution to the team.`;
    
    const distributionResult = await distributeBlockscoutMerits(
      employeeAddress,
      meritAmount,
      description,
      companyAddress
    );
    
    if (!distributionResult.success) {
      return {
        success: false,
        error: distributionResult.error || 'Failed to distribute merits via Blockscout'
      };
    }

    // Create the merit object for local tracking
    const merit: Merit = {
      id: `merit_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'employee_of_week',
      title: 'Employee of the Week',
      description: 'Recognized for outstanding performance and contribution to the team',
      awardedDate: new Date(),
      companyAddress,
      meritValue: 1,
      distributionId: `employee_of_week_${companyAddress}_${Date.now()}`
    };

    // Store last grant timestamp for cooldown (company-wide)
    const lastGrantKey = `last_merit_${companyAddress}`;
    localStorage.setItem(lastGrantKey, Date.now().toString());

    // Store merit locally for immediate display
    const meritsKey = `merits_${employeeAddress}`;
    const existingMerits = JSON.parse(localStorage.getItem(meritsKey) || '[]');
    existingMerits.push(merit);
    localStorage.setItem(meritsKey, JSON.stringify(existingMerits));

    console.log(`✅ Merit granted successfully via Blockscout! Distributed to ${distributionResult.response?.accounts_distributed} accounts, Created ${distributionResult.response?.accounts_created} new accounts`);

    return {
      success: true,
      merit
    };
  } catch (error) {
    console.error('❌ Error granting merit:', error);
    return {
      success: false,
      error: 'Failed to grant merit. Please try again.'
    };
  }
};

/**
 * Fetches employee merits from Blockscout Merits API
 * @param employeeAddress - The employee's wallet address
 * @param chainId - The blockchain chain ID
 * @returns Promise<Merit[]>
 */
export const fetchEmployeeMerits = async (
  employeeAddress: string,
  chainId: string = '1'
): Promise<Merit[]> => {
  try {
    console.log(`🔍 Fetching merits for ${employeeAddress} from Blockscout Merits API...`);

    // First, try to get basic merit user info
    const meritUser = await fetchBlockscoutMeritUser(employeeAddress);
    
    if (!meritUser) {
      console.log(`📭 No merit user found for ${employeeAddress} in Blockscout system`);
      
      // Fallback to localStorage for immediate display of recent merits
      const meritsKey = `merits_${employeeAddress}`;
      const localMerits = JSON.parse(localStorage.getItem(meritsKey) || '[]');
      
      return localMerits.map((merit: any) => ({
        ...merit,
        awardedDate: new Date(merit.awardedDate)
      }));
    }

    console.log(`✅ Found merit user with ${meritUser.total_balance} total merits`);

    // Try to get detailed activity logs (this requires user authentication, so we'll handle gracefully)
    let activityLogs: BlockscoutMeritActivityLog[] = [];
    
    // For now, we'll create merit objects based on the user's total balance
    // In a real implementation, you'd authenticate the user and get their activity logs
    const totalMerits = parseFloat(meritUser.total_balance);
    const estimatedEmployeeOfWeekMerits = Math.floor(totalMerits); // Assuming 1 merits per award
    
    const merits: Merit[] = [];
    
    // Create merit entries based on estimated awards (this is a simplified approach)
    for (let i = 0; i < estimatedEmployeeOfWeekMerits; i++) {
      const merit: Merit = {
        id: `blockscout_merit_${i}_${employeeAddress}`,
        type: 'employee_of_week',
        title: 'Employee of the Week',
        description: 'Recognized for outstanding performance and contribution to the team (from Blockscout)',
        awardedDate: new Date(meritUser.registered_at),
        companyAddress: 'company_via_blockscout',
        meritValue: 1
      };
      merits.push(merit);
    }

    // Merge with localStorage merits for any recent ones not yet reflected in Blockscout
    const meritsKey = `merits_${employeeAddress}`;
    const localMerits = JSON.parse(localStorage.getItem(meritsKey) || '[]');
    
    const allMerits = [
      ...merits,
      ...localMerits.map((merit: any) => ({
        ...merit,
        awardedDate: new Date(merit.awardedDate)
      }))
    ];

    // Sort by date (newest first)
    allMerits.sort((a, b) => b.awardedDate.getTime() - a.awardedDate.getTime());

    console.log(`✅ Found ${allMerits.length} total merits for ${employeeAddress}`);
    return allMerits;
  } catch (error) {
    console.error('❌ Error fetching employee merits:', error);
    
    // Fallback to localStorage
    const meritsKey = `merits_${employeeAddress}`;
    const localMerits = JSON.parse(localStorage.getItem(meritsKey) || '[]');
    
    return localMerits.map((merit: any) => ({
      ...merit,
      awardedDate: new Date(merit.awardedDate)
    }));
  }
};

/**
 * Check if company can grant merit (weekly cooldown check)
 * This now applies to ALL merit granting for the company, not per-employee
 * @param companyAddress - The company's wallet address
 * @returns Promise<{ canGrant: boolean; timeRemaining?: number }>
 */
export const checkMeritCooldown = async (
  companyAddress: string
): Promise<{ canGrant: boolean; timeRemaining?: number }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lastGrantKey = `last_merit_${companyAddress}`;
      const lastGrant = localStorage.getItem(lastGrantKey);
      const now = Date.now();
      
      if (!lastGrant) {
        resolve({ canGrant: true });
        return;
      }
      
      const timeSinceLastGrant = now - parseInt(lastGrant);
      const cooldownPeriod = 5000; // 5 seconds for testing (would be 1 week in production)
      
      if (timeSinceLastGrant >= cooldownPeriod) {
        resolve({ canGrant: true });
      } else {
        resolve({
          canGrant: false,
          timeRemaining: cooldownPeriod - timeSinceLastGrant
        });
      }
    }, 500);
  });
};

// =============================================================================
// TEAMS & EMPLOYEE MANAGEMENT
// =============================================================================

/**
 * Fetches company information for a client/individual user
 * @returns Promise<ClientCompanyInfo>
 */
export const fetchClientCompanyInfo = (): Promise<ClientCompanyInfo> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        companyId: 'comp_vankcliff_001',
        companyName: 'VankCliff Technologies',
        companyLogo: '/VankCliff_Logo.svg',
        address: {
          street: '1234 Innovation Drive, Suite 500',
          city: 'San Francisco',
          state: 'California',
          zipCode: '94105',
          country: 'United States'
        },
        industry: 'Blockchain & Financial Technology',
        foundedYear: 2019,
        employeeCount: 1, // Only one employee
        website: 'https://vankcliff.com',
        description: 'VankCliff Technologies is a leading blockchain and financial technology company focused on creating innovative solutions for the future of digital finance. We specialize in decentralized applications, smart contracts, and cutting-edge fintech solutions.',
        employmentDetails: {
          employeeId: 'emp_vc_2024_0156',
          employeeName: 'Mok Perdices Ortega',
          position: 'Senior Blockchain Developer',
          department: 'Development',
          startDate: new Date('2023-03-15'),
          employmentType: 'Full-time',
          status: 'Active',
          manager: 'CEO',
          workLocation: 'Remote'
        }
      });
    }, 1800); // 1.8-second delay
  });
};

/**
 * Fetches all teams with their employees - UNIFIED API CALL
 * @returns Promise<TeamsAndEmployeesData>
 */
export const fetchTeamsAndEmployees = (): Promise<TeamsAndEmployeesData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const teams: Team[] = [
        {
          id: '1',
          name: 'Development',
          budget: 0, // Will be calculated from employee salaries
          color: '#4ECDC4',
          members: [
            {
              id: '1',
              name: 'Mok Perdices Ortega',
              salary: 1000,
              walletAddress: '0x6Bf22C8B5a12bC8aEb8467846c91B4Efefa0edb7',
              teamId: '1'
            }
          ]
        },
        {
          id: '2',
          name: 'Marketing',
          budget: 0,
          color: '#FF6B6B',
          members: []
        },
        {
          id: '3',
          name: 'Design',
          budget: 0,
          color: '#45B7D1',
          members: []
        },
        {
          id: '4',
          name: 'Sales',
          budget: 0,
          color: '#96CEB4',
          members: []
        },
        {
          id: '5',
          name: 'Operations',
          budget: 0,
          color: '#FECA57',
          members: []
        },
        {
          id: '6',
          name: 'Legal',
          budget: 0,
          color: '#B8860B',
          members: []
        },
        {
          id: '7',
          name: 'HR',
          budget: 0,
          color: '#DDA0DD',
          members: []
        }
      ];

      // Calculate budget for each team based on employee salaries
      teams.forEach(team => {
        team.budget = team.members.reduce((sum, member) => sum + member.salary, 0);
      });

      const totalEmployees = teams.reduce((sum, team) => sum + team.members.length, 0);
      const totalTeamCosts = teams.reduce((sum, team) => sum + team.budget, 0);

      resolve({
        teams,
        totalEmployees,
        totalTeamCosts
      });
    }, 2000); // 2-second delay
  });
};

/**
 * Fetches all employees for the company (backwards compatibility)
 * @returns Promise<Employee[]>
 */
export const fetchEmployees = (): Promise<Employee[]> => {
  return fetchTeamsAndEmployees().then(data => {
    const allEmployees: Employee[] = [];
    data.teams.forEach(team => {
      allEmployees.push(...team.members);
    });
    return allEmployees;
  });
};

/**
 * Adds a new employee to a team
 * @param employeeData - The employee data to add
 * @returns Promise<{ success: boolean; employee?: Employee; error?: string }>
 */
export const addEmployee = (employeeData: AddEmployeeRequest): Promise<{ success: boolean; employee?: Employee; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate validation
      if (!employeeData.walletAddress || !employeeData.name || !employeeData.teamId) {
        resolve({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      // Check if this is trying to add the existing employee
      if (employeeData.walletAddress === '0x6Bf22C8B5a12bC8aEb8467846c91B4Efefa0edb7') {
        resolve({
          success: false,
          error: 'Employee already exists in the system'
        });
        return;
      }

      const newEmployee: Employee = {
        id: `emp_${Date.now()}`,
        name: employeeData.name,
        salary: employeeData.salary,
        walletAddress: employeeData.walletAddress,
        teamId: employeeData.teamId
      };

      resolve({
        success: true,
        employee: newEmployee
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Creates a new team
 * @param teamData - The team data to create
 * @returns Promise<{ success: boolean; team?: Team; error?: string }>
 */
export const createTeam = (teamData: CreateTeamRequest): Promise<{ success: boolean; team?: Team; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate validation
      if (!teamData.name) {
        resolve({
          success: false,
          error: 'Team name is required'
        });
        return;
      }

      const newTeam: Team = {
        id: `team_${Date.now()}`,
        name: teamData.name,
        budget: 0, // Budget will be calculated from employee salaries
        color: teamData.color,
        members: []
      };

      resolve({
        success: true,
        team: newTeam
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Deletes a team
 * @param teamId - The ID of the team to delete
 * @returns Promise<{ success: boolean; error?: string }>
 */
export const deleteTeam = (teamId: string): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate validation
      if (!teamId) {
        resolve({
          success: false,
          error: 'Team ID is required'
        });
        return;
      }

      // In a real implementation, you would check if the team has members
      // and handle accordingly (either prevent deletion or reassign members)
      resolve({
        success: true
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Processes salary payments for all employees using the CompanyLiquidityManager contract
 * @param employees - Array of employees to pay
 * @param totalAmount - Total amount to be paid
 * @returns Promise<PaymentResult>
 */
export const processPayrollPayments = async (
  employees: Employee[], 
  totalAmount: number
): Promise<PaymentResult> => {
  try {
    const { addLiquidity, createPayroll } = usePayrollContract();
    
    // Get pool address from env
    const poolAddress = process.env.NEXT_PUBLIC_LIQUIDITY_POOL_ADDRESS as `0x${string}`;
    if (!poolAddress) {
      throw new Error('Pool address not configured');
    }

    // 1. Add liquidity
    const amount = BigInt(totalAmount * 1e18);
    await addLiquidity(
      poolAddress,
      amount,
      amount
    );

    // 2. Create payroll
    const payrollId = BigInt(Date.now());
    const startTime = BigInt(Math.floor(Date.now() / 1000));
    const endTime = startTime + BigInt(30 * 24 * 60 * 60); // 30 days from now

    const receipt = await createPayroll(
      payrollId,
      BigInt(0), // positionIndex
      employees.map(e => e.walletAddress as `0x${string}`),
      employees.map(e => BigInt(e.salary * 1e18)),
      startTime,
      endTime
    );

    return {
      success: true,
      transactionId: receipt.transactionHash
    };

  } catch (error) {
    console.error('Error processing payroll payments:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// =============================================================================
// DASHBOARD & PORTFOLIO DATA
// =============================================================================

/**
 * Fetches dashboard data for the main page
 * @returns Promise<DashboardData>
 */
export const fetchDashboardData = (): Promise<DashboardData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        dashboardStats: {
          totalUsers: 1087,
          activeProjects: 32,
          completedTasks: 756,
          revenue: '$98,230'
        },
        projects: [
          { id: 1, name: 'Blockchain Explorer', status: 'active', progress: 60 },
          { id: 2, name: 'Smart Contract Audit', status: 'completed', progress: 100 }
        ],
        notifications: [
          { id: 1, message: 'System update completed', time: '5 minutes ago' }
        ]
      });
    }, 1500); // 1.5-second delay
  });
};

/**
 * Fetches portfolio data for different sections
 * @param sectionId - The section identifier
 * @returns Promise<any>
 */
export const fetchSectionData = (sectionId: string): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData = {
        portfolio: { value: '$24,567.89', change: '+$1,234.56 (+5.3%)' },
        transactions: [],
        tradingData: { volume: '$156,789', pairs: 12 }
      };
      resolve(mockData);
    }, 1500); // 1.5-second delay
  });
};

/**
 * Fetches individual portfolio data
 * @returns Promise<PortfolioData>
 */
export const fetchPortfolioData = (): Promise<PortfolioData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        value: '$24,567.89',
        change: '+$1,234.56 (+5.3%) today'
      });
    }, 1500); // 1.5-second delay
  });
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Simulates a generic API call with customizable delay and data
 * @param data - The data to return
 * @param delay - Delay in milliseconds (default: 1000)
 * @returns Promise<T>
 */
export const simulateApiCall = <T>(data: T, delay: number = 1000): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delay);
  });
};

/**
 * Simulates an API call that might fail
 * @param data - The data to return on success
 * @param delay - Delay in milliseconds
 * @param failureRate - Probability of failure (0-1)
 * @returns Promise<T>
 */
export const simulateApiCallWithFailure = <T>(
  data: T, 
  delay: number = 1000, 
  failureRate: number = 0.1
): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < failureRate) {
        reject(new Error('Simulated API failure'));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

export async function getContractEvents(
  contractAddress: string,
  fromBlock: bigint,
  toBlock: bigint,
  eventName: string
): Promise<any[]> {
  try {
    // Get public client from wagmi config
    const publicClient = getPublicClient(wagmiConfig)
    if (!publicClient) {
      throw new Error('No public client available')
    }

    // ... rest of the function ...
  } catch (error) {
    console.error('Error getting contract events:', error)
    throw error
  }
}

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export default {
  // Treasury & Finances
  fetchTreasuryBalance,
  
  // Teams & Employee Management
  fetchTeamsAndEmployees,
  fetchEmployees,
  addEmployee,
  createTeam,
  deleteTeam,
  processPayrollPayments,
  
  // Employee Company Information
  fetchClientCompanyInfo,
  fetchIndividualBalance,
  fetchCreditScore,
  
  // Merit System
  grantEmployeeOfWeekMerit,
  fetchEmployeeMerits,
  checkMeritCooldown,
  
  // Dashboard & Portfolio
  fetchDashboardData,
  fetchSectionData,
  fetchPortfolioData,
  
  // Utilities
  simulateApiCall,
  simulateApiCallWithFailure,
  getContractEvents
}; 