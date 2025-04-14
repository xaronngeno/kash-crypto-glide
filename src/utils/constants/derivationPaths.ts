
// Define the derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  // Bitcoin path (BIP44) using secp256k1
  BITCOIN: "m/44'/0'/0'/0/0",
  
  // Ethereum path (BIP44) using secp256k1
  ETHEREUM: "m/44'/60'/0'/0/0", 
  
  // Solana path - using BIP44 standard for Solana with ed25519
  SOLANA: "m/44'/501'/0'/0'"
};

// Exporting the key types for reference
export const KEY_TYPES = {
  BITCOIN: "secp256k1",
  ETHEREUM: "secp256k1",
  SOLANA: "ed25519"
};
