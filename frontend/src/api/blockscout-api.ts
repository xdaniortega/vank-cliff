/**
 * Blockscout API Service
 * Handles all interactions with Blockscout's REST API for real blockchain data
 */

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
 * Convert native token amount to USD using exchange rate
 */
export const convertNativeTokenToUsd = (
  tokenAmount: number,
  exchangeRate?: string
): number => {
  if (!exchangeRate) {
    // Fallback rates for demonstration
    return tokenAmount * 2000; // Assuming ~$2000 per ETH
  }
  
  const rate = parseFloat(exchangeRate);
  return tokenAmount * rate;
}; 