
/**
 * Define constants used across edge functions
 */

// Define the derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  // Bitcoin paths for different address types
  BITCOIN_LEGACY: "m/44'/0'/0'/0/0",
  BITCOIN_SEGWIT: "m/49'/0'/0'/0/0",
  BITCOIN_NATIVE_SEGWIT: "m/84'/0'/0'/0/0",
  
  // Ethereum standard path
  ETHEREUM: "m/44'/60'/0'/0/0",
  
  // Solana standard path - this is what most wallet apps use
  SOLANA: "m/44'/501'/0'/0'"
};

// BIP44 constants for reference
export const BIP44_PURPOSE = 44;
export const BIP44_BITCOIN_COIN_TYPE = 0;
export const BIP44_ETHEREUM_COIN_TYPE = 60;
export const BIP44_SOLANA_COIN_TYPE = 501;
