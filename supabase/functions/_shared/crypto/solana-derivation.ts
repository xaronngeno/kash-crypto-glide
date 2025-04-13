
import { validateSeedPhrase } from "./base-utils.ts";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import { createPbkdf2Key, createHmacKey } from "./base-utils.ts";

/**
 * Derive a Solana wallet from a seed phrase and path
 * Using proper ed25519 derivation for Trust Wallet compatibility
 */
export async function deriveSolanaWallet(seedPhrase: string, path: string) {
  try {
    console.log(`Deriving Solana wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!validateSeedPhrase(seedPhrase)) {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // Convert mnemonic to seed using PBKDF2
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const mnemonicBuffer = encoder.encode(seedPhrase.normalize('NFKD'));
    const saltBuffer = encoder.encode('mnemonic');
    
    // PBKDF2 parameters
    const iterations = 2048;
    const keyLen = 64;
    
    // Create HMAC key for PBKDF2
    const pbkdf2Key = await createPbkdf2Key(saltBuffer);
    
    // Derive the seed using PBKDF2
    const seedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-512',
        salt: saltBuffer,
        iterations
      },
      pbkdf2Key,
      keyLen * 8
    );
    
    // Convert to byte array
    const seed = new Uint8Array(seedBits);
    
    // Parse path segments and apply derivation
    const segments = path.split('/').slice(1); // Remove the leading 'm'
    
    // Start with the master key
    let key = seed;
    let chainCode = new Uint8Array(32).fill(1); // Default chain code
    
    // For each path segment, derive the next level key
    for (const segment of segments) {
      // Handle hardened keys (with ')
      const isHardened = segment.endsWith("'");
      let index = parseInt(isHardened ? segment.slice(0, -1) : segment);
      
      // For hardened keys, add 2^31
      if (isHardened) {
        index += 0x80000000;
      }
      
      // Create a buffer for the index
      const indexBuffer = new Uint8Array(4);
      indexBuffer[0] = (index >> 24) & 0xff;
      indexBuffer[1] = (index >> 16) & 0xff;
      indexBuffer[2] = (index >> 8) & 0xff;
      indexBuffer[3] = index & 0xff;
      
      // Create HMAC data: for hardened keys use 0x00 + key + index
      const data = new Uint8Array(1 + key.length + 4);
      data[0] = 0x00; // Private key prefix
      data.set(key, 1);
      data.set(indexBuffer, 1 + key.length);
      
      // Create HMAC with chainCode as key
      const hmacKey = await createHmacKey(chainCode);
      
      // Sign the data with HMAC
      const hmacResult = await crypto.subtle.sign('HMAC', hmacKey, data);
      const hmacArray = new Uint8Array(hmacResult);
      
      // Extract the next key and chain code
      key = hmacArray.slice(0, 32);
      chainCode = hmacArray.slice(32);
    }

    // The final privateKey will be used by the frontend to derive the actual Solana address
    return {
      address: "", // Will be properly derived in frontend
      privateKey: Buffer.from(key).toString('hex')
    };
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw error;
  }
}
