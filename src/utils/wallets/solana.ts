
import { Buffer } from '../globalPolyfills';
import { Keypair } from '@solana/web3.js';
import * as bs58 from '../bs58Wrapper';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { DERIVATION_PATHS } from '../constants/derivationPaths';
import { WalletData } from '../walletConfig';

// Generate a Solana wallet using proper ed25519 derivation
export const generateSolanaWallet = (seedPhrase?: string): WalletData => {
  try {
    let keypair: Keypair;
    
    if (seedPhrase) {
      // Derive Solana keypair from seed phrase using proper ed25519 derivation
      console.log("Generating Solana wallet from seed phrase with proper ed25519 derivation");
      
      // Convert mnemonic to seed (64 bytes)
      const seed = bip39.mnemonicToSeedSync(seedPhrase);
      
      // Use ed25519-hd-key to derive the key using the proper path
      // This is crucial for compatibility with Phantom wallet and other Solana wallets
      const { key } = derivePath(DERIVATION_PATHS.SOLANA, seed.toString('hex'));
      
      // Create keypair from the derived seed, using only the first 32 bytes as required by fromSeed
      keypair = Keypair.fromSeed(Uint8Array.from(key.slice(0, 32)));
    } else {
      // Generate a random keypair
      keypair = Keypair.generate();
    }
    
    const address = keypair.publicKey.toString();
    
    return {
      blockchain: 'Solana',
      platform: 'Solana',
      address: address,
      privateKey: bs58.encode(keypair.secretKey),
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw new Error('Failed to generate Solana wallet: ' + (error instanceof Error ? error.message : String(error)));
  }
};

// Verify a Solana address is valid
export const verifySolanaAddress = (address: string): boolean => {
  try {
    // Basic validation - Solana addresses are base58 encoded and typically around 32-44 chars
    if (!address || typeof address !== 'string' || address.trim() === '') return false;
    
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return base58Regex.test(address);
  } catch (error) {
    console.error('Error validating Solana address:', error);
    return false;
  }
};
