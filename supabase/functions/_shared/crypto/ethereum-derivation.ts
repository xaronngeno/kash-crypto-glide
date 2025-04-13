
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { validateSeedPhrase } from "./base-utils.ts";

/**
 * Derive an Ethereum wallet from a seed phrase and path
 */
export function deriveEthereumWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Ethereum wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    const wallet = ethers.HDNodeWallet.fromPhrase(
      seedPhrase,
      undefined,
      path
    );
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error("Error deriving Ethereum wallet:", error);
    throw error;
  }
}
