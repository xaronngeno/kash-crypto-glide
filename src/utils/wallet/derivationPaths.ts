
/**
 * Standard BIP-44 derivation paths for different blockchains
 */
export const DERIVATION_PATHS = {
  BITCOIN: "m/84'/0'/0'/0/0", // Native SegWit (BIP84)
  ETHEREUM: "m/44'/60'/0'/0/0", // BIP44 for Ethereum
  SOLANA: "m/44'/501'/0'/0'", // BIP44 for Solana (note the trailing ')
  TRON: "m/44'/195'/0'/0/0", // BIP44 for Tron
  POLYGON: "m/44'/60'/0'/0/0", // BIP44 for Polygon (same as Ethereum)
};
