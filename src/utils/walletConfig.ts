
// Combines types and constants for wallet configuration
import { Buffer } from './globalPolyfills';

// Define the derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  BITCOIN: "m/84'/0'/0'/0/0", // Native SegWit (BIP84)
  ETHEREUM: "m/44'/60'/0'/0/0", // BIP44 for Ethereum
  SOLANA: "m/44'/501'/0'/0'", // BIP44 for Solana (note the trailing ')
  TRON: "m/44'/195'/0'/0/0" // BIP44 for Tron
};

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Native Segwit"
  seedPhrase?: string; // For returning the seed phrase
}

// Blockchain types for type safety
export type BlockchainType = 'Ethereum' | 'Solana' | 'Bitcoin';

// Wallet generation result interface
export interface WalletGenerationResult {
  address: string;
  privateKey: string;
  seedPhrase?: string;
}
