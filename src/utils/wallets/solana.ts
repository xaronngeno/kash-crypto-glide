
import { Buffer } from '../globalPolyfills';
import { Keypair } from '@solana/web3.js';
import * as bs58 from '../bs58Wrapper';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { DERIVATION_PATHS } from '../constants/derivationPaths';
import { WalletData } from '../types/wallet';

// Generate a Solana wallet using proper derivation
export const generateSolanaWallet = (seedPhrase?: string): WalletData => {
  try {
    let keypair: Keypair;
    
    if (seedPhrase) {
      // Derive Solana keypair from seed phrase using proper ed25519 derivation
      console.log("Generating Solana wallet from seed phrase with proper ed25519 derivation");
      const seed = bip39.mnemonicToSeedSync(seedPhrase);
      const derived = derivePath(DERIVATION_PATHS.SOLANA, seed.toString('hex'));
      keypair = Keypair.fromSeed(Uint8Array.from(derived.key));
      console.log("Created Solana wallet from seed phrase with proper derivation");
    } else {
      // Generate a random keypair
      keypair = Keypair.generate();
      console.log("Generated random Solana wallet");
    }
    
    return {
      blockchain: 'Solana',
      platform: 'Solana',
      address: keypair.publicKey.toString(),
      privateKey: bs58.encode(keypair.secretKey),
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
