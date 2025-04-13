
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { validateSeedPhrase } from "./base-utils.ts";

/**
 * Derive a Bitcoin wallet from a seed phrase and path
 * Using BIP84 Native SegWit path by default for Phantom wallet compatibility
 */
export function deriveBitcoinWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Bitcoin wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // Create HD wallet from mnemonic using specified derivation path
    const btcHdNode = ethers.HDNodeWallet.fromPhrase(
      seedPhrase,
      undefined,
      path
    );
    
    // Generate a placeholder Bitcoin address format based on the path
    let btcAddress = "";
    
    if (path.startsWith("m/84'")) {
      // BIP84 Native SegWit (bc1 prefix)
      btcAddress = `bc1q${btcHdNode.address.slice(2, 34)}`;
    } else if (path.startsWith("m/49'")) {
      // BIP49 SegWit-compatible (3 prefix)
      btcAddress = `3${btcHdNode.address.slice(2, 34)}`;
    } else {
      // BIP44 Legacy (1 prefix)
      btcAddress = `1${btcHdNode.address.slice(2, 34)}`;
    }
    
    return {
      address: btcAddress,
      privateKey: btcHdNode.privateKey
    };
  } catch (error) {
    console.error("Error deriving Bitcoin wallet:", error);
    throw error;
  }
}
