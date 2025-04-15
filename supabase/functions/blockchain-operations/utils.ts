
import { corsHeaders } from '../_shared/cors.ts';

// Network endpoints - optimized for production mainnet use
export const NETWORK_ENDPOINTS = {
  ETHEREUM: {
    MAINNET: 'https://ethereum.publicnode.com',
    TESTNET: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  },
  SOLANA: {
    MAINNET: 'https://api.mainnet-beta.solana.com',
    TESTNET: 'https://api.devnet.solana.com',
  }
};

// Set to mainnet for production use
export const NETWORK_ENV = 'MAINNET';

// Application commission wallets - updated with your addresses
export const APPLICATION_WALLETS = {
  ETHEREUM: '0x5D2bEE609F1E302B19329d0B9FC4F68b446F2F68', // Your ETH wallet
  SOLANA: '4c15FP5MGt1sUR8Xd9AJdL84C1EMXhXVwuqCcxfgCgDu', // Your Solana address
};

// Commission settings (can be moved to database later)
export const COMMISSION_SETTINGS = {
  PERCENTAGE: 0.005, // 0.5% commission (updated from 1%)
  MIN_COMMISSION: {
    ETHEREUM: 0.0002, // Minimum 0.0002 ETH (reduced to match percentage)
    SOLANA: 0.005, // Minimum 0.005 SOL (reduced to match percentage)
  },
  MAX_COMMISSION: {
    ETHEREUM: 0.025, // Maximum 0.025 ETH (reduced to match percentage)
    SOLANA: 0.5, // Maximum 0.5 SOL (reduced to match percentage)
  }
};

// Helper to track operations for clean shutdown
export function trackOperation<T>(operation: Promise<T>, activeOperations: { count: number }): Promise<T> {
  activeOperations.count++;
  return operation.finally(() => {
    activeOperations.count--;
    if (activeOperations.count < 0) activeOperations.count = 0;
  });
}

// Calculate commission for a transaction
export function calculateCommission(amount: number, blockchain: string): {
  commissionAmount: number;
  finalAmount: number;
} {
  const percentage = COMMISSION_SETTINGS.PERCENTAGE;
  const commissionAmount = amount * percentage;
  
  // Apply min/max commission constraints
  let finalCommission = commissionAmount;
  
  if (blockchain === 'Ethereum') {
    finalCommission = Math.max(finalCommission, COMMISSION_SETTINGS.MIN_COMMISSION.ETHEREUM);
    finalCommission = Math.min(finalCommission, COMMISSION_SETTINGS.MAX_COMMISSION.ETHEREUM);
  } else if (blockchain === 'Solana') {
    finalCommission = Math.max(finalCommission, COMMISSION_SETTINGS.MIN_COMMISSION.SOLANA);
    finalCommission = Math.min(finalCommission, COMMISSION_SETTINGS.MAX_COMMISSION.SOLANA);
  }
  
  // Make sure commission isn't larger than the amount
  finalCommission = Math.min(finalCommission, amount * 0.5); // Never take more than 50%
  
  // Calculate final amount after commission
  const finalAmount = amount - finalCommission;
  
  return {
    commissionAmount: finalCommission,
    finalAmount
  };
}
