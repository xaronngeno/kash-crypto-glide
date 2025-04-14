
// Derivation path constants for different blockchains
export const DERIVATION_PATHS = {
  // Bitcoin paths
  BITCOIN_LEGACY: "m/44'/0'/0'/0/0",          // Legacy format (1...)
  BITCOIN_SEGWIT: "m/49'/0'/0'/0/0",          // SegWit compatible (3...)
  BITCOIN_NATIVE_SEGWIT: "m/84'/0'/0'/0/0",   // Native SegWit (bc1...)
  
  // Ethereum path - standard BIP44
  ETHEREUM: "m/44'/60'/0'/0/0",
  
  // Solana path - standard path used by Solana wallets
  SOLANA: "m/44'/501'/0'/0'"
};
