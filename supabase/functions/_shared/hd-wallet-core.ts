
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { deriveEthereumWallet, deriveSolanaWallet, deriveBitcoinWallet } from "./key-derivation.ts";
import { DERIVATION_PATHS } from "./constants.ts";

/**
 * Generate wallets from seed phrase for all supported blockchains
 * Ensuring consistent derivation across different wallet applications
 */
export async function generateHDWallets(seedPhrase: string, userId: string) {
  try {
    console.log("Generating HD wallets from seed phrase");
    
    // Ensure the seed phrase is valid
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      throw new Error("Invalid or empty seed phrase provided");
    }
    
    // Validate seed phrase format
    if (!ethers.Mnemonic.isValidMnemonic(seedPhrase)) {
      throw new Error(`Invalid mnemonic format: ${seedPhrase.substring(0, 5)}...`);
    }
    
    // Derive wallets using the correct derivation paths for each blockchain
    // This ensures compatibility with standard wallets
    
    // Derive Ethereum wallet with standard BIP44 path
    const ethereum = deriveEthereumWallet(seedPhrase, DERIVATION_PATHS.ETHEREUM);
    
    // Derive Solana wallet - handle the async nature properly
    const solana = await deriveSolanaWallet(seedPhrase, DERIVATION_PATHS.SOLANA);
    
    // Derive Bitcoin Native SegWit wallet (bc1 prefix)
    const bitcoinSegwit = deriveBitcoinWallet(seedPhrase, DERIVATION_PATHS.BITCOIN_NATIVE_SEGWIT);
    
    // Return all wallets together with the mnemonic for later recovery
    return {
      ethereum,
      solana,
      bitcoinSegwit,
      mnemonic: seedPhrase
    };
  } catch (error) {
    console.error("Error generating HD wallets:", error);
    throw error;
  }
}
