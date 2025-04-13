
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { validateSeedPhrase } from "./base-utils.ts";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import * as nacl from "https://deno.land/x/tweetnacl_deno@v1.1.2/src/nacl.ts";

/**
 * Derive a Solana wallet from a seed phrase and path
 * Using an alternative approach that works within Deno runtime
 */
export async function deriveSolanaWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Solana wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // Generate seed using ethers - similar approach to Ethereum wallet
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    
    // Extract entropy from the wallet
    // This is a simplified approach that will generate a consistent private key 
    // based on the seed phrase, but won't follow the exact derivation path
    // However, it will be consistent across calls with the same seed phrase
    const entropyBuffer = Buffer.from(wallet.privateKey.slice(2), 'hex');
    
    // Generate a Solana keypair from the entropy
    const keyPair = nacl.sign.keyPair.fromSeed(entropyBuffer.slice(0, 32));
    
    // Get public key in base58 format - this would usually be done on frontend
    // but we'll return a placeholder for now
    const privateKey = Buffer.from(keyPair.secretKey).toString('hex');
    
    // Return the keypair
    return {
      address: "", // Will be derived properly in frontend
      privateKey: privateKey
    };
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw error;
  }
}
