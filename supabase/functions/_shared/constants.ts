
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
  
  // Solana standard path
  SOLANA: "m/44'/501'/0'/0'"
};
