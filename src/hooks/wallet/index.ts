
// Export all wallet-related hooks and functions from a single file
export * from './fetchWalletBalances';
export * from './useWalletManager';
export * from './useWalletProcessor';
export * from './useWalletCleanup';

// Export createUserWallets for backward compatibility
export { createUserWallets } from './useWalletManager';
