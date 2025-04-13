
import { deriveEthereumWallet, deriveSolanaWallet, deriveBitcoinWallet } from "./key-derivation.ts";

/**
 * Generate wallets from seed phrase for all supported blockchains
 */
export async function generateHDWallets(seedPhrase: string, userId: string) {
  try {
    console.log("Generating HD wallets from seed phrase");
    
    // Derive Ethereum wallet
    const ethereum = deriveEthereumWallet(seedPhrase);
    
    // Derive Solana wallet with address generation
    const solanaDeriver = deriveSolanaWallet(seedPhrase);
    const solana = await solanaDeriver.deriveFullAddress();
    
    // Derive Bitcoin SegWit wallet
    const bitcoinSegwit = deriveBitcoinWallet(seedPhrase);
    
    // Return all wallets together
    return {
      ethereum,
      solana,
      bitcoinSegwit
    };
  } catch (error) {
    console.error("Error generating HD wallets:", error);
    throw error;
  }
}
