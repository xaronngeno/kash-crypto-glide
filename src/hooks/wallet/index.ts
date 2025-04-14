
// Export all wallet-related hooks and functions from a single file
export * from './useWalletManager';
export * from './useWalletProcessor';
export * from './useWalletCleanup';
export * from './useSeedPhrase';
export * from './useWalletValidator';
export * from './useWalletGenerator';
export * from './createUserWallets';

// Export the fetchWalletBalances functions directly
export { 
  fetchWalletBalances,
  refreshWalletBalances 
} from './fetchWalletBalances';

// For backward compatibility, ensure this is exported
export { createUserWallets } from './createUserWallets';
