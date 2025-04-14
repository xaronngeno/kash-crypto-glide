
// Unified wallet generation for Ethereum and Solana
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import * as bs58 from '../bs58Wrapper';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from '../globalPolyfills';
import { DERIVATION_PATHS, WalletData } from '../walletConfig';

// Unified wallet generator functions - only ETH, SOL
export const generateWallet = {
  // Ethereum wallet generation
  ethereum: async (seedPhrase?: string): Promise<WalletData> => {
    try {
      let wallet;
      
      if (seedPhrase) {
        // Derive from seed phrase
        wallet = ethers.HDNodeWallet.fromPhrase(
          seedPhrase, 
          undefined, 
          DERIVATION_PATHS.ETHEREUM
        );
      } else {
        // Create random wallet
        wallet = ethers.Wallet.createRandom();
      }
      
      return {
        blockchain: 'Ethereum',
        platform: 'Ethereum',
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error) {
      console.error('Error generating ETH wallet:', error);
      throw new Error('Failed to generate Ethereum wallet');
    }
  },
  
  // Solana wallet generation
  solana: async (seedPhrase?: string): Promise<WalletData> => {
    try {
      let keypair: Keypair;
      
      if (seedPhrase) {
        // Derive Solana keypair from seed phrase using proper ed25519 derivation
        console.log("Generating Solana wallet with ed25519 derivation");
        const seed = bip39.mnemonicToSeedSync(seedPhrase);
        const { key } = derivePath(DERIVATION_PATHS.SOLANA, seed.toString('hex'));
        
        // Create keypair from the derived seed using only the first 32 bytes
        keypair = Keypair.fromSeed(Uint8Array.from(key.slice(0, 32)));
      } else {
        // Generate a random keypair
        keypair = Keypair.generate();
      }
      
      return {
        blockchain: 'Solana',
        platform: 'Solana',
        address: keypair.publicKey.toString(),
        privateKey: bs58.encode(keypair.secretKey)
      };
    } catch (error) {
      console.error('Error generating Solana wallet:', error);
      throw new Error('Failed to generate Solana wallet');
    }
  }
};

// Re-export individual functions for backward compatibility
export const generateEthWallet = generateWallet.ethereum;
export const generateSolanaWallet = generateWallet.solana;
