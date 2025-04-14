
// Derivation path constants for different blockchains
export const DERIVATION_PATHS = {
  // Bitcoin path
  BITCOIN: "m/44'/0'/0'/0/0",         // BIP44 standard using secp256k1
  
  // Ethereum path - standard BIP44
  ETHEREUM: "m/44'/60'/0'/0/0",       // BIP44 standard using secp256k1
  
  // Solana path - standard path used by Solana wallets
  SOLANA: "m/44'/501'/0'/0'"          // BIP44 standard using ed25519
};
