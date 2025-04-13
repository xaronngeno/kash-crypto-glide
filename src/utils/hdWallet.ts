
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import * as bs58 from './bs58Wrapper';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from './globalPolyfills';
import { getCryptoLibs } from './cryptoWrappers';
import * as ecc from 'tiny-secp256k1';
import { DERIVATION_PATHS, WalletData } from './walletConfig';
import { generateWallet } from './wallets';

/**
 * Generate all wallets for a user from a seed phrase
 */
export const generateWalletsFromSeed = async (seedPhrase: string): Promise<WalletData[]> => {
  try {
    console.log('Generating wallets from seed phrase');
    return await generateWalletsFromSeedPhrase(seedPhrase);
  } catch (error) {
    console.error('Error generating wallets from seed phrase:', error);
    throw error;
  }
};

/**
 * Generate unified wallets with ethers built-in HD wallet functionality
 */
export const generateUnifiedWallets = async (seedPhrase?: string): Promise<WalletData[]> => {
  try {
    console.log("Generating unified wallets from seed phrase");
    
    // Use provided seed phrase or generate a new one
    let mnemonic;
    if (seedPhrase) {
      // Validate the provided seed phrase
      if (!ethers.Mnemonic.isValidMnemonic(seedPhrase)) {
        throw new Error("Invalid seed phrase provided");
      }
      mnemonic = seedPhrase;
      console.log("Using provided seed phrase");
    } else {
      // Generate a random mnemonic with ethers
      const wallet = ethers.Wallet.createRandom();
      mnemonic = wallet.mnemonic?.phrase;
      
      if (!mnemonic) {
        throw new Error("Failed to generate mnemonic");
      }
      console.log("Generated new seed phrase");
    }
    
    const wallets: WalletData[] = [];
    
    try {
      // Generate Ethereum wallet
      const ethWallet = await generateWallet.ethereum(mnemonic);
      wallets.push(ethWallet);
    } catch (error) {
      console.error("Failed to generate Ethereum wallet:", error);
    }
    
    try {
      // Generate Solana wallet
      const solWallet = await generateWallet.solana(mnemonic);
      wallets.push(solWallet);
    } catch (error) {
      console.error("Failed to generate Solana wallet:", error);
    }
    
    try {
      // Generate Bitcoin wallet
      const btcWallet = await generateWallet.bitcoin(mnemonic);
      wallets.push(btcWallet);
    } catch (error) {
      console.error("Failed to generate Bitcoin wallet:", error);
    }
    
    // Return the generated seed phrase along with the wallets
    console.log(`Generated ${wallets.length} unified wallets`);
    
    // Add the seed phrase to the first wallet for retrieval
    if (wallets.length > 0) {
      (wallets[0] as any).seedPhrase = mnemonic;
    }
    
    return wallets;
  } catch (error) {
    console.error("Error in unified wallet generation:", error);
    throw error;
  }
};

/**
 * Generate wallets from an existing seed phrase
 * This is a convenience wrapper around generateUnifiedWallets
 */
export const generateWalletsFromSeedPhrase = async (seedPhrase: string): Promise<WalletData[]> => {
  return generateUnifiedWallets(seedPhrase);
};

/**
 * New function to extract the seed phrase from generated wallets
 */
export const extractSeedPhrase = async (): Promise<string | null> => {
  try {
    // Generate wallets, which internally also creates a seed phrase
    const unifiedWallets = await generateUnifiedWallets();
    
    // Extract the seed phrase from the first wallet
    const seedPhrase = (unifiedWallets[0] as any).seedPhrase;
    return seedPhrase || null;
  } catch (error) {
    console.error('Error extracting seed phrase:', error);
    return null;
  }
};
