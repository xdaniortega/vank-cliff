/**
 * Utility functions for formatting numbers and balances
 */

/**
 * Formats a balance value (in wei) to a human-readable string
 * @param balance - The balance in wei (bigint)
 * @param decimals - Number of decimal places to show (default: 2)
 * @param symbol - Optional token symbol to append
 * @returns Formatted balance string
 */
export const formatBalance = (balance: bigint | null | undefined, decimals: number = 2, symbol?: string): string => {
  if (balance === null || balance === undefined) return '0';
  
  // Convert from wei to token units (divide by 1e18)
  const amount = Number(balance) / 1e18;
  
  // Format with specified decimals
  const formatted = amount.toLocaleString(undefined, { 
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
  
  // Append symbol if provided
  return symbol ? `${formatted} ${symbol}` : formatted;
};

/**
 * Formats a number to a human-readable string with specified decimals
 * @param amount - The number to format
 * @param decimals - Number of decimal places to show (default: 2)
 * @param symbol - Optional token symbol to append
 * @returns Formatted number string
 */
export const formatAmount = (amount: number | null | undefined, decimals: number = 2, symbol?: string): string => {
  if (amount === null || amount === undefined) return '0';
  
  const formatted = amount.toLocaleString(undefined, { 
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals
  });
  
  return symbol ? `${formatted} ${symbol}` : formatted;
}; 