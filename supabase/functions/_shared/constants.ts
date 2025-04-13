
// Define derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  BITCOIN_SEGWIT: "m/84'/0'/0'/0/0", // BIP84 - Native SegWit
  BITCOIN: "m/44'/0'/0'/0/0",      // BIP44 - Legacy for Trust Wallet compatibility
  ETHEREUM: "m/44'/60'/0'/0/0",    // BIP44 - Ethereum
  SOLANA: "m/44'/501'/0'/0'"       // BIP44 - Solana
};

// Define additional constants for clarity
export const BIP44_PURPOSE = 44;
export const BIP44_BITCOIN_COIN_TYPE = 0;
export const BIP44_ETHEREUM_COIN_TYPE = 60;
export const BIP44_SOLANA_COIN_TYPE = 501;
