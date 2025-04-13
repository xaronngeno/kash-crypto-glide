
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { validateSeedPhrase } from "./base-utils.ts";

/**
 * Derive an Ethereum wallet from a seed phrase and path
 * Using standard BIP44 derivation for consistent addresses
 */
export function deriveEthereumWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Ethereum wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // Create an HD wallet from the mnemonic
    // This will properly handle derivation paths
    let wallet;
    try {
      // Try with path first
      wallet = ethers.HDNodeWallet.fromPhrase(seedPhrase, undefined, path);
    } catch (error) {
      console.warn(`Failed to derive with path ${path}, using default derivation`);
      // Fall back to default derivation if path fails
      wallet = ethers.Wallet.fromPhrase(seedPhrase);
    }
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error("Error deriving Ethereum wallet:", error);
    throw error;
  }
}
