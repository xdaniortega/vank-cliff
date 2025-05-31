/**
 * Price API Service
 * Fetches real-time cryptocurrency prices from CoinGecko API
 */

export interface PriceData {
  symbol: string;
  usdPrice: number;
  lastUpdated: Date;
}

// CoinGecko token ID mappings for different tokens
const TOKEN_ID_MAP: Record<string, string> = {
  'ETH': 'ethereum',
  'MATIC': 'matic-network',
  'FLOW': 'flow',
  'BTC': 'bitcoin',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'BNB': 'binancecoin',
  'ADA': 'cardano',
  'SOL': 'solana',
  'DOT': 'polkadot',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'SUSHI': 'sushi',
  'COMP': 'compound-governance-token'
};

/**
 * Get CoinGecko token ID from symbol
 */
const getTokenId = (symbol: string): string => {
  return TOKEN_ID_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
};

/**
 * Fetch current price for a single token from CoinGecko
 */
export const fetchTokenPrice = async (symbol: string): Promise<PriceData | null> => {
  const tokenId = getTokenId(symbol);
  
  try {
    console.log(`🔍 Fetching price for ${symbol} (${tokenId}) from CoinGecko...`);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd&include_last_updated_at=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ CoinGecko API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data[tokenId] || !data[tokenId].usd) {
      console.error(`❌ No price data found for ${symbol}`);
      return null;
    }

    const priceData: PriceData = {
      symbol: symbol.toUpperCase(),
      usdPrice: data[tokenId].usd,
      lastUpdated: new Date(data[tokenId].last_updated_at * 1000)
    };

    console.log(`✅ Price fetched: ${symbol} = $${priceData.usdPrice}`);
    
    return priceData;
  } catch (error) {
    console.error(`❌ Error fetching price for ${symbol}:`, error);
    return null;
  }
};

/**
 * Fetch prices for multiple tokens from CoinGecko
 */
export const fetchMultipleTokenPrices = async (symbols: string[]): Promise<Record<string, PriceData> | null> => {
  const tokenIds = symbols.map(symbol => getTokenId(symbol));
  const idsString = tokenIds.join(',');
  
  try {
    console.log(`🔍 Fetching prices for multiple tokens from CoinGecko...`);
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${idsString}&vs_currencies=usd&include_last_updated_at=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`❌ CoinGecko API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    const prices: Record<string, PriceData> = {};

    symbols.forEach((symbol, index) => {
      const tokenId = tokenIds[index];
      if (data[tokenId] && data[tokenId].usd) {
        prices[symbol.toUpperCase()] = {
          symbol: symbol.toUpperCase(),
          usdPrice: data[tokenId].usd,
          lastUpdated: new Date(data[tokenId].last_updated_at * 1000)
        };
      }
    });

    console.log(`✅ Fetched prices for ${Object.keys(prices).length} tokens`);
    
    return prices;
  } catch (error) {
    console.error('❌ Error fetching multiple token prices:', error);
    return null;
  }
};

/**
 * Convert native token amount to USD using real-time price
 */
export const convertTokenToUsd = async (
  tokenAmount: number,
  tokenSymbol: string
): Promise<number | null> => {
  const priceData = await fetchTokenPrice(tokenSymbol);
  
  if (!priceData) {
    console.warn(`⚠️ Could not fetch price for ${tokenSymbol}, using fallback conversion`);
    return null;
  }

  const usdAmount = tokenAmount * priceData.usdPrice;
  console.log(`💰 Converted ${tokenAmount} ${tokenSymbol} to $${usdAmount.toFixed(2)} USD`);
  
  return usdAmount;
};

/**
 * Convert USD amount to native token using real-time price
 */
export const convertUsdToToken = async (
  usdAmount: number,
  tokenSymbol: string
): Promise<number | null> => {
  const priceData = await fetchTokenPrice(tokenSymbol);
  
  if (!priceData) {
    console.warn(`⚠️ Could not fetch price for ${tokenSymbol}, using fallback conversion`);
    return null;
  }

  const tokenAmount = usdAmount / priceData.usdPrice;
  console.log(`💰 Converted $${usdAmount} USD to ${tokenAmount.toFixed(6)} ${tokenSymbol}`);
  
  return tokenAmount;
};

// Fallback exchange rates for when CoinGecko is unavailable
const FALLBACK_RATES: Record<string, number> = {
  'ETH': 2000,
  'MATIC': 0.8,
  'FLOW': 0.7,
  'BTC': 35000,
  'USDC': 1,
  'USDT': 1,
  'BNB': 300,
  'ADA': 0.5,
  'SOL': 100,
  'DOT': 7,
  'AVAX': 35,
  'LINK': 15,
  'UNI': 8,
  'AAVE': 100,
  'SUSHI': 1.5,
  'COMP': 50
};

/**
 * Get fallback price for a token when API is unavailable
 */
export const getFallbackPrice = (tokenSymbol: string): number => {
  const symbol = tokenSymbol.toUpperCase();
  return FALLBACK_RATES[symbol] || 1000; // Default fallback price
};

/**
 * Convert token to USD with fallback to hardcoded rates
 */
export const convertTokenToUsdWithFallback = async (
  tokenAmount: number,
  tokenSymbol: string
): Promise<number> => {
  // Try to get real-time price first
  const realPrice = await convertTokenToUsd(tokenAmount, tokenSymbol);
  
  if (realPrice !== null) {
    return realPrice;
  }
  
  // Fallback to hardcoded rates
  const fallbackPrice = getFallbackPrice(tokenSymbol);
  const usdAmount = tokenAmount * fallbackPrice;
  
  console.warn(`⚠️ Using fallback rate for ${tokenSymbol}: $${fallbackPrice}`);
  console.log(`💰 Fallback conversion: ${tokenAmount} ${tokenSymbol} = $${usdAmount.toFixed(2)} USD`);
  
  return usdAmount;
}; 