
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { validateSeedPhrase } from "./base-utils.ts";

/**
 * Derive a Bitcoin wallet from a seed phrase and path
 * Using a simplified approach for consistency
 */
export function deriveBitcoinWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Bitcoin wallet with path: ${path || "m/84'/0'/0'/0/0"}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // Create HD wallet from mnemonic using ethers
    const hdNode = ethers.HDNodeWallet.fromPhrase(seedPhrase);
    
    // Derive the key at the specified path or use default
    const actualPath = path || "m/84'/0'/0'/0/0";
    const derivedNode = hdNode.derivePath(actualPath);
    
    // Generate a placeholder Bitcoin address
    // The actual formatting will be done on the frontend
    let placeholderAddress = "";
    
    // Determine address format based on path
    if (actualPath.startsWith("m/84'")) {
      // BIP84 Native SegWit (bc1 prefix)
      placeholderAddress = `bc1${derivedNode.address.slice(2, 34)}`;
    } else if (actualPath.startsWith("m/49'")) {
      // BIP49 SegWit-compatible (3 prefix)
      placeholderAddress = `3${derivedNode.address.slice(2, 34)}`;
    } else {
      // BIP44 Legacy (1 prefix)
      placeholderAddress = `1${derivedNode.address.slice(2, 34)}`;
    }
    
    return {
      address: placeholderAddress,
      privateKey: derivedNode.privateKey
    };
  } catch (error) {
    console.error("Error deriving Bitcoin wallet:", error);
    throw error;
  }
}
