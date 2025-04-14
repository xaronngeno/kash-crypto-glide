
// Import Buffer from Deno's standard library
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { derivePath } from "https://esm.sh/ed25519-hd-key@1.3.0";
import { Keypair } from "https://esm.sh/@solana/web3.js@1.91.1";
import * as bip39 from "https://esm.sh/bip39@3.1.0";
import { DERIVATION_PATHS } from "./hd-constants.ts";

// Derive Ethereum wallet from seed phrase
export function deriveEthereumWallet(seedPhrase: string) {
  try {
    console.log("Deriving Ethereum wallet with path:", DERIVATION_PATHS.ETHEREUM);
    
    // Generate the HD wallet using ethers
    const ethWallet = ethers.HDNodeWallet.fromPhrase(
      seedPhrase,
      undefined,
      DERIVATION_PATHS.ETHEREUM
    );
    
    return {
      address: ethWallet.address,
      privateKey: ethWallet.privateKey
    };
  } catch (error) {
    console.error("Error deriving Ethereum wallet:", error);
    throw error;
  }
}

// Derive Solana wallet from seed phrase
export async function deriveSolanaWallet(seedPhrase: string) {
  try {
    console.log("Deriving Solana wallet with path:", DERIVATION_PATHS.SOLANA);
    
    // Convert seed phrase to seed buffer
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    
    try {
      // Derive key using proper ed25519 derivation with Solana path
      const { key } = derivePath(DERIVATION_PATHS.SOLANA, Buffer.from(seed).toString("hex"));
      
      // Create keypair from derived key (using only first 32 bytes as required)
      const keypair = Keypair.fromSeed(Uint8Array.from(key.slice(0, 32)));
      
      if (!keypair || !keypair.publicKey) {
        throw new Error("Failed to generate valid Solana keypair");
      }
      
      return {
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString("hex")
      };
    } catch (keypairError) {
      console.error("Error creating Solana keypair:", keypairError);
      
      // Fallback to direct keypair generation
      console.log("Attempting fallback Solana wallet generation");
      const fallbackKeypair = Keypair.generate();
      
      return {
        address: fallbackKeypair.publicKey.toString(),
        privateKey: Buffer.from(fallbackKeypair.secretKey).toString("hex")
      };
    }
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw new Error(`Solana wallet derivation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Create Ethereum wallet using RPC derivation
export async function createEthereumWallet(mnemonic?: string) {
  try {
    let wallet;
    if (mnemonic) {
      wallet = ethers.Wallet.fromPhrase(mnemonic);
    } else {
      wallet = ethers.Wallet.createRandom();
    }
    
    return {
      address: wallet.address,
      private_key: wallet.privateKey
    };
  } catch (error) {
    console.error("Error creating Ethereum wallet:", error);
    throw error;
  }
}

// Create Solana wallet
export async function createSolanaWallet(mnemonic?: string) {
  try {
    let keypair;
    if (mnemonic) {
      try {
        // Convert mnemonic to seed
        const seed = await bip39.mnemonicToSeed(mnemonic);
        
        // Derive key using proper Solana path
        const { key } = derivePath(DERIVATION_PATHS.SOLANA, Buffer.from(seed).toString("hex"));
        
        // Create keypair from derived key
        keypair = Keypair.fromSeed(Uint8Array.from(key.slice(0, 32)));
      } catch (derivationError) {
        console.error("Error in Solana key derivation:", derivationError);
        // Fallback to direct keypair generation
        keypair = Keypair.generate();
      }
    } else {
      // Generate a random keypair
      keypair = Keypair.generate();
    }
    
    return {
      address: keypair.publicKey.toString(),
      private_key: Buffer.from(keypair.secretKey).toString("hex")
    };
  } catch (error) {
    console.error("Error creating Solana wallet:", error);
    throw error;
  }
}
