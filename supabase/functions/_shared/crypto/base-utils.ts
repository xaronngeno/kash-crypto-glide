
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

/**
 * Validate a seed phrase
 */
export function validateSeedPhrase(seedPhrase: string): boolean {
  try {
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      console.error("Invalid or empty seed phrase");
      return false;
    }
    
    return ethers.Mnemonic.isValidMnemonic(seedPhrase);
  } catch (error) {
    console.error("Error validating seed phrase:", error);
    return false;
  }
}

/**
 * Create HMAC key for PBKDF2
 */
export async function createPbkdf2Key(data: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
}

/**
 * Create HMAC key for signing
 */
export async function createHmacKey(data: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
}
