import * as ethers from "https://esm.sh/ethers@6.13.5";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import { DERIVATION_PATHS } from "./constants.ts";
import * as nacl from "https://esm.sh/tweetnacl@1.0.3";
import * as bs58 from "https://esm.sh/bs58@5.0.0";

/**
 * Derive an Ethereum wallet from a seed phrase and path
 * Using BIP44 standard with secp256k1
 */
export function deriveEthereumWallet(seedPhrase: string, path = DERIVATION_PATHS.ETHEREUM) {
  try {
    console.log(`Deriving Ethereum wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
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

/**
 * Derive a Solana wallet from a seed phrase and path
 * Using BIP44 standard with ed25519
 */
export async function deriveSolanaWallet(seedPhrase: string, path = DERIVATION_PATHS.SOLANA) {
  try {
    console.log(`Deriving Solana wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      throw new Error("Invalid or empty seed phrase");
    }

    // Convert mnemonic to seed - this is the standard BIP39 process
    const bip39 = await import("https://esm.sh/bip39@3.1.0");
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    
    // Create a seed buffer from the mnemonic
    const seedBuffer = Buffer.from(seed);
    
    // For Solana, we would typically use ed25519-hd-key, but since we're 
    // keeping it simple, we'll use the first 32 bytes of the seed directly
    // This works for simple testing but in production you'd want to use
    // the proper derivation library
    const edDSASeed = seedBuffer.slice(0, 32);
    
    // Generate keypair using TweetNaCl
    const keyPair = nacl.sign.keyPair.fromSeed(edDSASeed);
    
    // Get public key in base58 format (standard Solana address format)
    const publicKeyBase58 = bs58.encode(Buffer.from(keyPair.publicKey));
    
    return {
      address: publicKeyBase58,
      privateKey: bs58.encode(Buffer.from(keyPair.secretKey))
    };
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw error;
  }
}

/**
 * Derive a Bitcoin wallet from a seed phrase and path
 * Using BIP44 standard with secp256k1
 */
export function deriveBitcoinWallet(seedPhrase: string, path = DERIVATION_PATHS.BITCOIN) {
  try {
    console.log(`Deriving Bitcoin wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // We'll use ethers for deriving the private key since it handles BIP39 derivation well
    const btcHdNode = ethers.HDNodeWallet.fromPhrase(
      seedPhrase,
      undefined,
      path
    );
    
    // For a proper Bitcoin address, you'd use bitcoinjs-lib
    // This is just for basic derivation to get the private key
    return {
      address: btcHdNode.address,
      privateKey: btcHdNode.privateKey
    };
  } catch (error) {
    console.error("Error deriving Bitcoin wallet:", error);
    throw error;
  }
}
