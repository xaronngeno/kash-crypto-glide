
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { validateSeedPhrase } from "./base-utils.ts";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import { derivePath } from "https://esm.sh/ed25519-hd-key@1.3.0";

/**
 * Derive a Solana wallet from a seed phrase and path
 * Using direct HD node derivation for consistency with Ethereum approach
 */
export async function deriveSolanaWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Solana wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // First, generate a seed buffer using ethers - similar to Ethereum approach
    // This is crucial to maintain consistency across wallet derivations
    const hdNode = ethers.HDNodeWallet.fromPhrase(seedPhrase);
    
    // Convert mnemonic to seed bytes
    const seedHex = hdNode.privateKey.slice(2); // Remove '0x' prefix
    const seedBuffer = Buffer.from(seedHex, 'hex');
    
    if (!seedBuffer || seedBuffer.length === 0) {
      throw new Error("Failed to generate valid seed buffer");
    }
    
    // For Solana, we need to use ed25519 derivation with the seed
    // This is specific to Solana's ed25519 curve requirement
    const { key } = derivePath(path, seedBuffer.toString('hex'));
    
    if (!key || key.length === 0) {
      throw new Error("Failed to derive Solana key");
    }
    
    // For Solana, we'll return the private key in hex format
    // The actual address will be derived in the frontend using Solana libraries
    return {
      address: "", // Will be derived properly in frontend
      privateKey: Buffer.from(key).toString('hex')
    };
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw error;
  }
}
