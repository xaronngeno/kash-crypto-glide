
// Define the derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  BITCOIN: "m/84'/0'/0'/0/0", // Native SegWit (BIP84)
  ETHEREUM: "m/44'/60'/0'/0/0", // BIP44 for Ethereum
  SOLANA: "m/44'/501'/0'/0'" // BIP44 for Solana (note the trailing ')
};
