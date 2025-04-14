
// Define derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  // Bitcoin paths for different address types
  BITCOIN_NATIVE_SEGWIT: "m/84'/0'/0'/0/0",  // BIP84 - Native SegWit (bc1 addresses)
  BITCOIN_SEGWIT: "m/49'/0'/0'/0/0",         // BIP49 - SegWit (3 addresses)
  BITCOIN: "m/44'/0'/0'/0/0",               // BIP44 - Legacy (1 addresses)
  
  // Standard paths for other blockchains
  ETHEREUM: "m/44'/60'/0'/0/0",             // BIP44 - Ethereum
  SOLANA: "m/44'/501'/0'/0'"                // BIP44 - Solana
};

// Define additional constants for clarity
export const BIP44_PURPOSE = 44;
export const BIP44_BITCOIN_COIN_TYPE = 0;
export const BIP44_ETHEREUM_COIN_TYPE = 60;
export const BIP44_SOLANA_COIN_TYPE = 501;
