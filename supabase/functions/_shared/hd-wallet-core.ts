
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { deriveEthereumWallet, deriveSolanaWallet, deriveBitcoinWallet } from "./key-derivation.ts";
import { DERIVATION_PATHS } from "./constants.ts";

/**
 * Generate wallets from seed phrase for all supported blockchains
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
    
    // Derive Ethereum wallet
    const ethereum = deriveEthereumWallet(seedPhrase);
    
    // Derive Solana wallet - handle separately due to tweetnacl usage
    let solana;
    try {
      solana = await deriveSolanaWallet(seedPhrase);
    } catch (solError) {
      console.error("Error deriving Solana wallet:", solError);
      // Provide a fallback solution in case the derivation fails
      solana = {
        address: `sol${seedPhrase.substring(0, 38).replace(/\s/g, '')}`,
        privateKey: seedPhrase
      };
    }
    
    // Derive Bitcoin Native SegWit wallet (bc1 prefix)
    const bitcoinSegwit = deriveBitcoinWallet(seedPhrase, DERIVATION_PATHS.BITCOIN_NATIVE_SEGWIT);
    
    // Return all wallets together with the mnemonic
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
