
import { Keypair } from '@solana/web3.js';
import { Buffer } from '../globalPolyfills';
import { WalletData } from '../walletGenerators';
import { mnemonicToSeedSync } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

// Standard derivation path for Solana wallets using BIP44
const SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'";

/**
 * Generate a Solana wallet using deterministic derivation (when a seed is provided)
 * or randomly if no seed is provided
 */
export const generateSolanaWallet = (privateKeyHex?: string, seedPhrase?: string): WalletData => {
  try {
    let keypair: Keypair;
    
    if (seedPhrase) {
      // Derive Solana keypair from seed phrase using proper ed25519 derivation
      console.log("Generating Solana wallet from seed phrase with ed25519 derivation");
      const seed = mnemonicToSeedSync(seedPhrase);
      const derived = derivePath(SOLANA_DERIVATION_PATH, seed).key;
      keypair = Keypair.fromSeed(new Uint8Array(derived));
      console.log("Created Solana wallet from seed phrase with proper derivation");
    } else if (privateKeyHex) {
      // Convert hex string to Uint8Array for Solana keypair
      // For ed25519, we need the full 64-byte secret key (32 bytes private + 32 bytes public)
      // If we have just the 32-byte private key, we need to create a proper secret key
      let secretKey: Uint8Array;
      
      if (privateKeyHex.startsWith('0x')) {
        privateKeyHex = privateKeyHex.substring(2);
      }
      
      const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
      
      // Check if we have a 32-byte private key or a 64-byte secret key
      if (privateKeyBytes.length === 32) {
        // We have a 32-byte private key, create a proper 64-byte secret key
        // This is a simplified approach - in production, derivation should use ed25519-hd-key
        secretKey = new Uint8Array(64);
        secretKey.set(privateKeyBytes);
        
        // The public key part will be auto-derived by the Keypair constructor
        keypair = Keypair.fromSeed(privateKeyBytes);
      } else if (privateKeyBytes.length === 64) {
        // We have a full secret key (private + public parts)
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } else {
        throw new Error(`Invalid Solana private key length: ${privateKeyBytes.length} bytes`);
      }
      
      console.log("Created Solana wallet from provided private key");
    } else {
      // Generate a random keypair
      keypair = Keypair.generate();
      console.log("Generated random Solana wallet");
    }
    
    return {
      blockchain: 'Solana',
      platform: 'Solana',
      address: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw new Error('Failed to generate Solana wallet');
  }
};

// Verify a Solana address is valid
export const verifySolanaAddress = (address: string): boolean => {
  try {
    // Basic validation - Solana addresses are base58 encoded and typically around 44 chars
    if (!address || typeof address !== 'string') return false;
    
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  } catch (error) {
    console.error('Error validating Solana address:', error);
    return false;
  }
};
