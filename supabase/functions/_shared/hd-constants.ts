
// HD wallet-specific constants
import { DERIVATION_PATHS } from "./constants.ts";

// Re-export the derivation paths for backward compatibility
export { DERIVATION_PATHS };

// Define standard BIP44 derivation index values
export const BIP44_PURPOSE = 44;
export const BIP44_BITCOIN_COIN_TYPE = 0;
export const BIP44_ETHEREUM_COIN_TYPE = 60;
export const BIP44_SOLANA_COIN_TYPE = 501;

// Hardened derivation indicator
export const HARDENED_OFFSET = 0x80000000;

// Function to get a coin-specific path from purpose and coin type
export function getDerivationPath(purpose: number, coinType: number, account = 0, change = 0, addressIndex = 0): string {
  // Handle the special case for Solana which doesn't use the last component
  if (coinType === BIP44_SOLANA_COIN_TYPE) {
    return `m/${purpose}'/${coinType}'/${account}'/${change}'`;
  }
  
  return `m/${purpose}'/${coinType}'/${account}'/${change}/${addressIndex}`;
}

// Added specific path constants for Bitcoin variants
export const BITCOIN_LEGACY_PATH = DERIVATION_PATHS.BITCOIN; // BIP44
export const BITCOIN_SEGWIT_PATH = DERIVATION_PATHS.BITCOIN_SEGWIT; // BIP84
