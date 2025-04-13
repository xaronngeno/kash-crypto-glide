
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import * as bs58 from './bs58Wrapper';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from './globalPolyfills';
import { getBitcoin } from './bitcoinjsWrapper';
import { getBip32 } from './bip32Wrapper';
import { getECPairFactory } from './ecpairWrapper';
import * as ecc from 'tiny-secp256k1';
import { DERIVATION_PATHS } from './constants/derivationPaths';
import { WalletData } from './types/wallet';

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
    
    // Generate Ethereum wallet using standard BIP44 path
    const ethHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.ETHEREUM
    );
    
    wallets.push({
      blockchain: "Ethereum",
      platform: "Ethereum",
      address: ethHdNode.address,
      privateKey: ethHdNode.privateKey
    });
    
    // Generate Solana wallet using proper ed25519 derivation
    try {
      // Convert mnemonic to seed using BIP39
      console.log('Generating Solana wallet with proper ed25519 derivation');
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const solDerivation = derivePath(DERIVATION_PATHS.SOLANA, seed.toString('hex'));
      const keypair = Keypair.fromSeed(Uint8Array.from(solDerivation.key));

      wallets.push({
        blockchain: "Solana",
        platform: "Solana",
        address: keypair.publicKey.toString(),
        privateKey: Buffer.from(keypair.secretKey).toString('hex')
      });
      
      console.log("Generated Solana wallet successfully with ed25519 derivation");
    } catch (error) {
      console.error("Failed to generate Solana wallet:", error);
    }
    
    // Generate Bitcoin wallet (Native SegWit - BIP84)
    try {
      // Get bitcoinjs-lib
      const bitcoin = await getBitcoin();
      
      // Get bip32 separately
      const bip32 = await getBip32();
      
      // Generate seed from mnemonic
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      
      // Derive the BIP84 path for SegWit
      const root = bip32.fromSeed(seed);
      const node = root.derivePath(DERIVATION_PATHS.BITCOIN);
      
      // Get ECPair factory
      const ECPair = await getECPairFactory(ecc);
      const keyPair = ECPair.fromPrivateKey(node.privateKey);
      
      // Generate a P2WPKH (Native SegWit) address
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: keyPair.publicKey,
        network: bitcoin.networks.bitcoin
      });
      
      if (!address) {
        throw new Error("Failed to generate Bitcoin address");
      }
      
      wallets.push({
        blockchain: "Bitcoin",
        platform: "Bitcoin",
        address: address,
        privateKey: '0x' + node.privateKey.toString('hex'),
        walletType: "Native SegWit"
      });
      console.log("Generated Bitcoin wallet successfully");
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
