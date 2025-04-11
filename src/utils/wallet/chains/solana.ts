
import { ethers } from 'ethers';
import { DERIVATION_PATHS } from '../derivationPaths';
import { UnifiedWalletData } from '../types';
import { Buffer } from '../../globalPolyfills';

// Try to import tweetnacl dynamically
const getTweetNaCl = async () => {
  try {
    return await import('tweetnacl');
  } catch (error) {
    console.error('Error importing tweetnacl:', error);
    throw error;
  }
};

/**
 * Generate a Solana wallet from a mnemonic
 */
export const generateSolanaWallet = async (mnemonicObj: ethers.Mnemonic): Promise<UnifiedWalletData> => {
  try {
    // Use HDNodeWallet.fromMnemonic with the Solana path
    const solanaHdNode = ethers.HDNodeWallet.fromMnemonic(
      mnemonicObj,
      DERIVATION_PATHS.SOLANA
    );
    
    // Get private key bytes from the HD node
    const privateKeyBytes = Buffer.from(solanaHdNode.privateKey.slice(2), 'hex').slice(0, 32);
    
    // Create a keypair using those bytes
    const nacl = await getTweetNaCl();
    const keypair = nacl.sign.keyPair.fromSeed(privateKeyBytes);
    
    // Get the public key as base58
    const publicKeyBase58 = await encodeBase58(Buffer.from(keypair.publicKey));
    
    return {
      blockchain: "Solana",
      platform: "Solana",
      address: publicKeyBase58,
      privateKey: Buffer.from(keypair.secretKey).toString('hex')
    };
  } catch (error) {
    console.error("Failed to generate Solana wallet:", error);
    throw error;
  }
};

/**
 * Generate a random Solana wallet (not derived from mnemonic)
 */
export const generateRandomSolanaWallet = async (): Promise<UnifiedWalletData> => {
  try {
    // Create random bytes for the seed
    const seed = crypto.getRandomValues(new Uint8Array(32));
    
    // Generate keypair from the random seed
    const nacl = await getTweetNaCl();
    const keypair = nacl.sign.keyPair.fromSeed(seed);
    
    // Get the public key as base58
    const publicKeyBase58 = await encodeBase58(Buffer.from(keypair.publicKey));
    
    return {
      blockchain: "Solana",
      platform: "Solana",
      address: publicKeyBase58,
      privateKey: Buffer.from(keypair.secretKey).toString('hex')
    };
  } catch (error) {
    console.error('Error generating random Solana wallet:', error);
    throw new Error('Failed to generate random Solana wallet');
  }
};

// Helper function to encode base58
async function encodeBase58(buffer: Uint8Array): Promise<string> {
  try {
    const bs58Module = await import('bs58');
    return bs58Module.default.encode(buffer);
  } catch (error) {
    console.error('Error encoding to base58:', error);
    throw error;
  }
}

/**
 * Verify if an address is a valid Solana address
 */
export const verifySolanaAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  // Solana addresses are base58 encoded strings, typically 32-44 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};
