// Define the derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  // Bitcoin Legacy path (BIP44) - P2PKH addresses (start with '1')
  BITCOIN: "m/44'/0'/0'/0/0",
  // Bitcoin SegWit compatible (P2SH) addresses (start with '3')
  BITCOIN_SEGWIT: "m/49'/0'/0'/0/0",
  // Bitcoin Native SegWit (bech32) addresses (start with 'bc1q')
  BITCOIN_NATIVE_SEGWIT: "m/84'/0'/0'/0/0",
  // Ethereum path (unchanged)
  ETHEREUM: "m/44'/60'/0'/0/0", 
  // Solana path (unchanged)
  SOLANA: "m/44'/501'/0'/0'"
};

// Define additional path constants for different Bitcoin derivation types
export const BITCOIN_PATHS = {
  // Legacy (P2PKH) addresses (start with '1')
  LEGACY: "m/44'/0'/0'/0/0",
  // SegWit-compatible (P2SH) addresses (start with '3')
  SEGWIT_COMPATIBLE: "m/49'/0'/0'/0/0",
  // Native SegWit (bech32) addresses (start with 'bc1')
  NATIVE_SEGWIT: "m/84'/0'/0'/0/0"
};
