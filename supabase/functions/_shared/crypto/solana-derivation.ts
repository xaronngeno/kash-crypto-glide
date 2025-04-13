
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { validateSeedPhrase } from "./base-utils.ts";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import * as ed25519 from "https://deno.land/x/ed25519@1.6.0/mod.ts";

/**
 * Derive a Solana wallet from a seed phrase and path
 * Using an approach that works within Deno runtime
 */
export async function deriveSolanaWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Solana wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // Use ethers to derive a deterministic private key from the seed phrase
    const wallet = ethers.Wallet.fromPhrase(seedPhrase);
    const privateKeyBuffer = Buffer.from(wallet.privateKey.slice(2), 'hex');
    
    // Use the first 32 bytes of the private key as input for ed25519 key generation
    const seed = privateKeyBuffer.slice(0, 32);
    
    // Generate keypair from the seed
    const keypair = ed25519.utils.getKeyPairFromSeed(seed);
    
    // Convert the keypair to hex format for storage
    const privateKey = Buffer.from(
      [...keypair.secretKey, ...keypair.publicKey]
    ).toString('hex');
    
    // Note: The actual Solana address will be derived on the frontend
    // We'll return the keypair data needed for that derivation
    return {
      address: Buffer.from(keypair.publicKey).toString('hex'),
      privateKey: privateKey
    };
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw error;
  }
}
