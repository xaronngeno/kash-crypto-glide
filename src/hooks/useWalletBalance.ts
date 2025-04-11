
// Re-export all wallet-related functionality from the new files
export {
  fetchWalletBalances,
  refreshWalletBalances,
  createUserWallets,
  useWalletCreationStatus,
  useWalletProcessor
} from './wallet';
