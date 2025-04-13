
/**
 * Main key derivation module - re-exports wallet derivation functions
 * Refactored into smaller files for better maintainability
 */
import { deriveEthereumWallet } from "./crypto/ethereum-derivation.ts";
import { deriveSolanaWallet } from "./crypto/solana-derivation.ts";
import { deriveBitcoinWallet } from "./crypto/bitcoin-derivation.ts";
import { validateSeedPhrase } from "./crypto/base-utils.ts";

// Re-export all wallet derivation functions
export {
  deriveEthereumWallet,
  deriveSolanaWallet,
  deriveBitcoinWallet,
  validateSeedPhrase
};

// Re-export the utility functions as well for backward compatibility
export * from "./crypto/base-utils.ts";
