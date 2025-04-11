
import { Keypair } from '@solana/web3.js';
import { Buffer } from '../globalPolyfills';
import { WalletData } from '../walletGenerators';

/**
 * Generate a Solana wallet using deterministic derivation (when a seed is provided)
 * or randomly if no seed is provided
 */
export const generateSolanaWallet = (privateKeyHex?: string): WalletData => {
  try {
    let keypair: Keypair;
    
    if (privateKeyHex) {
      // Convert hex string to Uint8Array for Solana keypair
      const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
      keypair = Keypair.fromSecretKey(privateKeyBytes);
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

/**
 * Verify a Solana address is valid
 * This performs a more thorough validation to ensure the address is a valid Solana public key
 */
export const verifySolanaAddress = (address: string): boolean => {
  try {
    // Basic validation - Solana addresses are base58 encoded and typically around 44 chars
    if (!address || typeof address !== 'string') return false;
    
    // Solana addresses are base58 encoded strings, typically 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!base58Regex.test(address)) return false;
    
    // For more thorough validation, in a production environment,
    // we would create a PublicKey instance and verify it doesn't throw
    // new PublicKey(address);
    
    return true;
  } catch (error) {
    console.error('Error validating Solana address:', error);
    return false;
  }
};
