
// HD wallet-specific constants

// Define standard derivation paths for HD wallets
export const DERIVATION_PATHS = {
  // Bitcoin path (BIP44) using secp256k1
  BITCOIN: "m/44'/0'/0'/0/0",
  
  // Ethereum path (BIP44) using secp256k1
  ETHEREUM: "m/44'/60'/0'/0/0", 
  
  // Solana path - using BIP44 standard for Solana with ed25519
  SOLANA: "m/44'/501'/0'/0'",
  
  // Bitcoin SegWit path (BIP84)
  BITCOIN_SEGWIT: "m/84'/0'/0'/0/0"
};

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
