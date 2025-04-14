
// Combines types and constants for wallet configuration
import { Buffer } from './globalPolyfills';

// Define the derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0", // BIP44 with secp256k1
  SOLANA: "m/44'/501'/0'/0'" // BIP44 with ed25519
};

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types
  seedPhrase?: string; // For returning the seed phrase
}

// Blockchain types for type safety
export type BlockchainType = 'Ethereum' | 'Solana';

// Wallet generation result interface
export interface WalletGenerationResult {
  address: string;
  privateKey: string;
  seedPhrase?: string;
}
