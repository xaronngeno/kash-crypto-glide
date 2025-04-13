
import { generateHDWallets } from "./hd-wallet-core.ts";
import { deriveEthereumWallet, deriveSolanaWallet, deriveBitcoinWallet } from "./key-derivation.ts";
import { DERIVATION_PATHS, BIP44_PURPOSE, BIP44_BITCOIN_COIN_TYPE, BIP44_ETHEREUM_COIN_TYPE, BIP44_SOLANA_COIN_TYPE } from "./hd-constants.ts";

// Re-export everything for backward compatibility
export {
  generateHDWallets,
  deriveEthereumWallet,
  deriveSolanaWallet,
  deriveBitcoinWallet,
  DERIVATION_PATHS,
  BIP44_PURPOSE,
  BIP44_BITCOIN_COIN_TYPE,
  BIP44_ETHEREUM_COIN_TYPE,
  BIP44_SOLANA_COIN_TYPE
};
