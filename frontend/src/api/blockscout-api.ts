/**
 * Blockscout API Service
 * Handles all interactions with Blockscout's REST API for real blockchain data
 */

import { convertTokenToUsdWithFallback } from './price-api';

export interface BlockscoutConfig {
  baseUrl: string;
  chainId: string;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
}

// Supported chain configurations
export const CHAIN_CONFIGS: Record<string, BlockscoutConfig> = {
  '1': {
    baseUrl: 'https://eth.blockscout.com',
    chainId: '1',
    nativeTokenSymbol: 'ETH',
    nativeTokenDecimals: 18
  },
  '137': {
    baseUrl: 'https://polygon.blockscout.com',
    chainId: '137',
    nativeTokenSymbol: 'MATIC',
    nativeTokenDecimals: 18
  },
  '42161': {
    baseUrl: 'https://arbitrum.blockscout.com',
    chainId: '42161',
    nativeTokenSymbol: 'ETH',
    nativeTokenDecimals: 18
  },
  '10': {
    baseUrl: 'https://optimism.blockscout.com',
    chainId: '10',
    nativeTokenSymbol: 'ETH',
    nativeTokenDecimals: 18
  },
  '747': {
    baseUrl: 'https://evm.flowscan.io',
    chainId: '747',
    nativeTokenSymbol: 'FLOW',
    nativeTokenDecimals: 18
  },
  // Note: Flow EVM Mainnet (747) doesn't have a public Blockscout API endpoint available
  // The official explorer is at https://evm.flowscan.io but doesn't use Blockscout API format
  // We'll handle this gracefully by returning null for unsupported chains
};

export interface BlockscoutBalance {
  value: string; // Balance in wei
  token_name: string;
  token_symbol: string;
  token_decimals: number;
}

export interface BlockscoutAccount {
  hash: string;
  coin_balance: string; // Native token balance in wei
  exchange_rate?: string;
  implementation_name?: string;
  implementation_address?: string;
  block_number_balance_updated_at?: number;
}

export interface BlockscoutTransaction {
  hash: string;
  block_number: number;
  from: {
    hash: string;
  };
  to: {
    hash: string;
  };
  value: string;
  gas_price: string;
  gas_used: string;
  gas_limit: string;
  status: 'ok' | 'error';
  block_timestamp: string;
  method?: string;
  tx_types: string[];
}

export interface BlockscoutTransactionsResponse {
  items: BlockscoutTransaction[];
  next_page_params?: {
    block_number: number;
    index: number;
  };
}

/**
 * Get the Blockscout configuration for a given chain ID
 */
export const getChainConfig = (chainId: string): BlockscoutConfig | null => {
  return CHAIN_CONFIGS[chainId] || null;
};

/**
 * Convert wei to formatted token amount
 */
export const weiToToken = (weiValue: string, decimals: number = 18): number => {
  const wei = BigInt(weiValue);
  const divisor = BigInt(10 ** decimals);
  const tokenAmount = Number(wei) / Number(divisor);
  return tokenAmount;
};

/**
 * Format token amount to display format
 */
export const formatTokenAmount = (amount: number, symbol: string, decimals: number = 4): string => {
  return `${amount.toFixed(decimals)} ${symbol}`;
};

/**
 * Fetch account balance from Blockscout
 */
export const fetchAccountBalance = async (
  address: string, 
  chainId: string
): Promise<{ balance: number; symbol: string; balanceWei: string } | null> => {
  const config = getChainConfig(chainId);
  if (!config) {
    console.warn(`🔗 Chain ID ${chainId} is not supported by Blockscout API`);
    
    // Add specific message for Flow EVM
    if (chainId === '747') {
      console.info('💡 Flow EVM Mainnet detected. Consider using Flows native APIs for balance queries.');
      console.info('📍 Explorer: https://evm.flowscan.io');
    }
    
    return null;
  }

  try {
    console.log(`🔍 Fetching balance from Blockscout for chain ${chainId}...`);
    
    const response = await fetch(
      `${config.baseUrl}/api/v2/addresses/${address}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutAccount = await response.json();
    
    const balance = weiToToken(data.coin_balance, config.nativeTokenDecimals);
    
    console.log(`✅ Balance fetched: ${balance} ${config.nativeTokenSymbol}`);
    
    return {
      balance,
      symbol: config.nativeTokenSymbol,
      balanceWei: data.coin_balance
    };
  } catch (error) {
    console.error('❌ Error fetching account balance from Blockscout:', error);
    return null;
  }
};

/**
 * Fetch account transactions from Blockscout
 */
export const fetchAccountTransactions = async (
  address: string,
  chainId: string,
  limit: number = 50
): Promise<BlockscoutTransaction[] | null> => {
  const config = getChainConfig(chainId);
  if (!config) {
    console.error(`Unsupported chain ID: ${chainId}`);
    return null;
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/api/v2/addresses/${address}/transactions?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Blockscout API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutTransactionsResponse = await response.json();
    return data.items;
  } catch (error) {
    console.error('Error fetching account transactions from Blockscout:', error);
    return null;
  }
};

/**
 * Check if a transaction exists in Blockscout
 */
export const fetchTransaction = async (
  txHash: string,
  chainId: string
): Promise<BlockscoutTransaction | null> => {
  const config = getChainConfig(chainId);
  if (!config) {
    console.error(`Unsupported chain ID: ${chainId}`);
    return null;
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/api/v2/transactions/${txHash}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      // Transaction might not exist yet (pending) or be invalid
      if (response.status === 404) {
        return null;
      }
      console.error(`Blockscout API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutTransaction = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching transaction from Blockscout:', error);
    return null;
  }
};

/**
 * Convert USD amount to native token amount using exchange rate
 * This is a simplified conversion - in production you'd want to use a proper price API
 */
export const convertUsdToNativeToken = (
  usdAmount: number,
  exchangeRate?: string
): number => {
  if (!exchangeRate) {
    // Fallback rates for demonstration
    return usdAmount / 2000; // Assuming ~$2000 per ETH
  }
  
  const rate = parseFloat(exchangeRate);
  return usdAmount / rate;
};

/**
 * Convert native token amount to USD using real-time price data
 */
export const convertNativeTokenToUsd = async (
  tokenAmount: number,
  tokenSymbol: string
): Promise<number> => {
  try {
    // Use the new price API to get real-time conversion
    const usdAmount = await convertTokenToUsdWithFallback(tokenAmount, tokenSymbol);
    return usdAmount;
  } catch (error) {
    console.error('❌ Error converting native token to USD:', error);
    
    // Fallback to hardcoded rates as last resort
    const fallbackRates: Record<string, number> = {
      'ETH': 2000,
      'MATIC': 0.8,
      'FLOW': 0.7,
      'BTC': 35000,
      'USDC': 1,
      'USDT': 1
    };
    
    const fallbackRate = fallbackRates[tokenSymbol.toUpperCase()] || 1000;
    const usdAmount = tokenAmount * fallbackRate;
    
    console.warn(`⚠️ Using emergency fallback rate for ${tokenSymbol}: $${fallbackRate}`);
    return usdAmount;
  }
};

/**
 * Fetch the latest block number from Blockscout
 */
export const fetchLatestBlockNumber = async (chainId: string): Promise<number | null> => {
  const config = getChainConfig(chainId);
  if (!config) {
    console.warn(`🔗 Chain ID ${chainId} is not supported by Blockscout API`);
    return null;
  }

  try {
    console.log(`🔍 Fetching latest block number from Blockscout for chain ${chainId}...`);
    
    const response = await fetch(
      `${config.baseUrl}/api/v2/blocks?type=block`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const latestBlock = data.items[0].height;
      console.log(`✅ Latest block number: ${latestBlock}`);
      return latestBlock;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching latest block number from Blockscout:', error);
    return null;
  }
};

/**
 * Search for merit transactions in Blockscout
 * Merit transactions are identified by a specific pattern in the input data
 */
export const fetchMeritTransactions = async (
  employeeAddress: string,
  chainId: string,
  limit: number = 100
): Promise<BlockscoutTransaction[]> => {
  const config = getChainConfig(chainId);
  if (!config) {
    console.warn(`🔗 Chain ID ${chainId} is not supported for merit lookup`);
    return [];
  }

  try {
    console.log(`🏆 Searching for merit transactions for ${employeeAddress}...`);
    
    const response = await fetch(
      `${config.baseUrl}/api/v2/addresses/${employeeAddress}/transactions?limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data: BlockscoutTransactionsResponse = await response.json();
    
    // Filter transactions that look like merit transactions
    // Merit transactions have a specific pattern in the transaction data
    const meritTransactions = data.items.filter(tx => {
      // Look for transactions TO the employee address with small amounts (merit transactions)
      return tx.to?.hash?.toLowerCase() === employeeAddress.toLowerCase() && 
             tx.value && 
             BigInt(tx.value) < BigInt('1000000000000000'); // Less than 0.001 ETH
    });

    console.log(`✅ Found ${meritTransactions.length} potential merit transactions`);
    return meritTransactions;
  } catch (error) {
    console.error('❌ Error fetching merit transactions from Blockscout:', error);
    return [];
  }
};

/**
 * Get transaction details including input data for merit parsing
 */
export const getTransactionDetails = async (
  txHash: string,
  chainId: string
): Promise<{
  transaction: BlockscoutTransaction;
  inputData?: string;
} | null> => {
  const config = getChainConfig(chainId);
  if (!config) {
    console.warn(`🔗 Chain ID ${chainId} is not supported`);
    return null;
  }

  try {
    const response = await fetch(
      `${config.baseUrl}/api/v2/transactions/${txHash}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const transaction: BlockscoutTransaction = await response.json();
    
    return {
      transaction,
      inputData: (transaction as any).raw_input // Blockscout includes raw input data
    };
  } catch (error) {
    console.error('❌ Error fetching transaction details from Blockscout:', error);
    return null;
  }
};

/**
 * Parse merit data from transaction input
 * Merit transactions encode merit information in the input data
 */
export const parseMeritFromTransaction = (
  transaction: BlockscoutTransaction,
  inputData?: string
): {
  id: string;
  type: 'employee_of_week';
  title: string;
  description: string;
  awardedDate: Date;
  companyAddress: string;
  blockchainTxHash: string;
  meritValue: number;
} | null => {
  try {
    // For demo purposes, we'll create merit data based on transaction properties
    // In a real implementation, you'd parse actual encoded data from the input
    
    if (!transaction.from?.hash || !transaction.to?.hash) {
      return null;
    }

    // Check if this looks like a merit transaction (small value transfer)
    const value = BigInt(transaction.value || '0');
    if (value >= BigInt('1000000000000000')) { // More than 0.001 ETH
      return null;
    }

    // Create merit object from transaction data
    return {
      id: `merit_${transaction.hash}_${Date.now()}`,
      type: 'employee_of_week',
      title: 'Employee of the Week',
      description: 'Recognized for outstanding performance and contribution to the team',
      awardedDate: new Date(transaction.block_timestamp),
      companyAddress: transaction.from.hash,
      blockchainTxHash: transaction.hash,
      meritValue: 1 // Standard merit value
    };
  } catch (error) {
    console.error('❌ Error parsing merit from transaction:', error);
    return null;
  }
};

/**
 * Create a merit transaction on the blockchain
 * This simulates creating a real blockchain transaction for merit granting
 */
export const createMeritTransaction = async (
  companyAddress: string,
  employeeAddress: string,
  chainId: string
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
}> => {
  const config = getChainConfig(chainId);
  if (!config) {
    return {
      success: false,
      error: `Chain ID ${chainId} is not supported for merit transactions`
    };
  }

  try {
    console.log(`🏆 Creating merit transaction from ${companyAddress} to ${employeeAddress}...`);
    
    // In a real implementation, this would:
    // 1. Connect to a wallet (MetaMask, WalletConnect, etc.)
    // 2. Create a transaction with encoded merit data
    // 3. Send the transaction to the blockchain
    // 4. Return the transaction hash
    
    // For now, we'll simulate this process
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    
    const mockTxHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    
    console.log(`✅ Merit transaction created: ${mockTxHash}`);
    
    return {
      success: true,
      txHash: mockTxHash
    };
  } catch (error) {
    console.error('❌ Error creating merit transaction:', error);
    return {
      success: false,
      error: 'Failed to create merit transaction'
    };
  }
};

/**
 * Blockscout Merits API Configuration
 */
export interface BlockscoutMeritsConfig {
  baseUrl: string;
  partnerApiKey?: string;
}

// Blockscout Merits API configuration
// For production, set NEXT_PUBLIC_BLOCKSCOUT_MERITS_API_KEY environment variable
// with your partner API key from Blockscout
export const MERITS_CONFIG: BlockscoutMeritsConfig = {
  baseUrl: 'https://merits-staging.blockscout.com',
  partnerApiKey: process.env.NEXT_PUBLIC_BLOCKSCOUT_MERITS_API_KEY || 'demo-key'
};

/**
 * Blockscout Merits API Interfaces
 */
export interface BlockscoutMeritUser {
  address: string;
  total_balance: string;
  staked: string;
  unstaked: string;
  registered_at: string;
  updated_at: string;
}

export interface BlockscoutMeritLeaderboard {
  address: string;
  total_balance: string;
  referrals: string;
  registered_at: string;
  rank: string;
  users_below: string;
  top_percent: number;
}

export interface BlockscoutMeritDistribution {
  address: string;
  amount: string;
}

export interface BlockscoutMeritDistributeRequest {
  id: string;
  description: string;
  distributions: BlockscoutMeritDistribution[];
  create_missing_accounts: boolean;
  expected_total: string;
}

export interface BlockscoutMeritDistributeResponse {
  accounts_distributed: string;
  accounts_created: string;
}

export interface BlockscoutMeritAuthNonce {
  nonce: string;
  merits_login_nonce: string | null;
}

export interface BlockscoutMeritAuthLogin {
  nonce: string;
  message: string;
  signature: string;
}

export interface BlockscoutMeritAuthResponse {
  created: boolean;
  token: string;
}

export interface BlockscoutMeritUserBalances {
  total: string;
  staked: string;
  unstaked: string;
  total_staking_rewards: string;
  total_referral_rewards: string;
  pending_referral_rewards: string;
}

export interface BlockscoutMeritActivityLog {
  action: string;
  details: {
    streak?: number;
    amount: string;
    date?: string;
    description?: string;
  };
  timestamp: string;
}

export interface BlockscoutMeritUserLogs {
  items: BlockscoutMeritActivityLog[];
  next_page_params?: {
    page_token: string;
    page_size: number;
  };
}

/**
 * Get basic Merit info for a user
 */
export const fetchBlockscoutMeritUser = async (
  address: string
): Promise<BlockscoutMeritUser | null> => {
  try {
    console.log(`🏆 Fetching Blockscout Merit info for ${address}...`);
    
    const response = await fetch(
      `${MERITS_CONFIG.baseUrl}/api/v1/auth/user/${address}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`📭 User ${address} not found in Blockscout Merits system`);
        return null;
      }
      console.error(`❌ Blockscout Merits API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutMeritUser = await response.json();
    console.log(`✅ Merit user info fetched for ${address}: ${data.total_balance} merits`);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching Blockscout Merit user info:', error);
    return null;
  }
};

/**
 * Get leaderboard ranking for a user
 */
export const fetchBlockscoutMeritLeaderboard = async (
  address: string
): Promise<BlockscoutMeritLeaderboard | null> => {
  try {
    console.log(`🏆 Fetching Blockscout Merit leaderboard for ${address}...`);
    
    const response = await fetch(
      `${MERITS_CONFIG.baseUrl}/api/v1/leaderboard/users/${address}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`📭 User ${address} not found in leaderboard`);
        return null;
      }
      console.error(`❌ Blockscout Merits API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutMeritLeaderboard = await response.json();
    console.log(`✅ Merit leaderboard info fetched for ${address}: Rank ${data.rank}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching Blockscout Merit leaderboard:', error);
    return null;
  }
};

/**
 * Distribute merits to employees using Partner API
 */
export const distributeBlockscoutMerits = async (
  employeeAddress: string,
  amount: string,
  description: string,
  companyId: string
): Promise<{
  success: boolean;
  response?: BlockscoutMeritDistributeResponse;
  error?: string;
}> => {
  try {
    console.log(`🏆 Distributing ${amount} merits to ${employeeAddress}...`);
    
    const distributionId = `employee_of_week_${companyId}_${Date.now()}`;
    
    const request: BlockscoutMeritDistributeRequest = {
      id: distributionId,
      description,
      distributions: [
        {
          address: employeeAddress,
          amount: amount
        }
      ],
      create_missing_accounts: true, // Allow creating accounts for new users
      expected_total: amount
    };

    const response = await fetch(
      `${MERITS_CONFIG.baseUrl}/partner/api/v1/distribute`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MERITS_CONFIG.partnerApiKey}`
        },
        body: JSON.stringify(request)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Blockscout Merits distribution failed: ${response.status} ${response.statusText}`, errorText);
      return {
        success: false,
        error: `Failed to distribute merits: ${response.status} ${response.statusText}`
      };
    }

    const data: BlockscoutMeritDistributeResponse = await response.json();
    console.log(`✅ Merits distributed successfully! Accounts: ${data.accounts_distributed}, Created: ${data.accounts_created}`);
    
    return {
      success: true,
      response: data
    };
  } catch (error) {
    console.error('❌ Error distributing Blockscout Merits:', error);
    return {
      success: false,
      error: 'Failed to distribute merits due to network error'
    };
  }
};

/**
 * Get authentication nonce for user login
 */
export const getBlockscoutMeritAuthNonce = async (): Promise<BlockscoutMeritAuthNonce | null> => {
  try {
    console.log(`🔐 Getting Blockscout Merit auth nonce...`);
    
    const response = await fetch(
      `${MERITS_CONFIG.baseUrl}/api/v1/auth/nonce`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout Merits nonce error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutMeritAuthNonce = await response.json();
    console.log(`✅ Auth nonce received: ${data.nonce}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error getting Blockscout Merit auth nonce:', error);
    return null;
  }
};

/**
 * Login user with signed message
 */
export const loginBlockscoutMeritUser = async (
  loginData: BlockscoutMeritAuthLogin
): Promise<BlockscoutMeritAuthResponse | null> => {
  try {
    console.log(`🔐 Logging in Blockscout Merit user...`);
    
    const response = await fetch(
      `${MERITS_CONFIG.baseUrl}/api/v1/auth/login`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout Merits login error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutMeritAuthResponse = await response.json();
    console.log(`✅ User logged in successfully, created: ${data.created}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error logging in Blockscout Merit user:', error);
    return null;
  }
};

/**
 * Get user balance details (requires authentication token)
 */
export const fetchBlockscoutMeritUserBalances = async (
  authToken: string
): Promise<BlockscoutMeritUserBalances | null> => {
  try {
    console.log(`🏆 Fetching Blockscout Merit user balances...`);
    
    const response = await fetch(
      `${MERITS_CONFIG.baseUrl}/api/v1/user/balances`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout Merits user balances error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutMeritUserBalances = await response.json();
    console.log(`✅ User balances fetched: Total ${data.total}, Unstaked ${data.unstaked}`);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching Blockscout Merit user balances:', error);
    return null;
  }
};

/**
 * Get user activity logs (requires authentication token)
 */
export const fetchBlockscoutMeritUserLogs = async (
  authToken: string,
  pageSize: number = 50,
  pageToken?: string
): Promise<BlockscoutMeritUserLogs | null> => {
  try {
    console.log(`🏆 Fetching Blockscout Merit user activity logs...`);
    
    const params = new URLSearchParams({
      page_size: pageSize.toString()
    });
    
    if (pageToken) {
      params.append('page_token', pageToken);
    }
    
    const response = await fetch(
      `${MERITS_CONFIG.baseUrl}/api/v1/user/logs?${params}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ Blockscout Merits user logs error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: BlockscoutMeritUserLogs = await response.json();
    console.log(`✅ User activity logs fetched: ${data.items.length} items`);
    
    return data;
  } catch (error) {
    console.error('❌ Error fetching Blockscout Merit user logs:', error);
    return null;
  }
}; 