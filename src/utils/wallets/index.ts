
// Unified wallet generation for Ethereum, Solana, and Bitcoin
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import * as bs58 from '../bs58Wrapper';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from '../globalPolyfills';
import { getCryptoLibs } from '../cryptoWrappers';
import * as ecc from 'tiny-secp256k1';
import { DERIVATION_PATHS, WalletData } from '../walletConfig';

// Unified wallet generator functions - only BTC, ETH, SOL
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
        keypair = Keypair.fromSeed(Uint8Array.from(key));
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
  },
  
  // Bitcoin wallet generation (Legacy P2PKH)
  bitcoin: async (seedPhrase?: string): Promise<WalletData> => {
    try {
      // Get crypto libraries
      const { bitcoin, bip32, ECPair } = await getCryptoLibs();
      
      // Create key pair from seed phrase or generate new random one
      let keyPair;
      let mnemonicPhrase;
      
      if (seedPhrase) {
        mnemonicPhrase = seedPhrase;
        // Generate seed from mnemonic
        const seed = bip39.mnemonicToSeedSync(seedPhrase);
        
        // Derive the node from seed using BIP44 path for Legacy addresses
        const root = bip32.fromSeed(seed);
        const node = root.derivePath(DERIVATION_PATHS.BITCOIN);
        
        // Get key pair from derived node
        keyPair = ECPair.fromPrivateKey(node.privateKey);
      } else {
        // Generate random key pair
        keyPair = ECPair.makeRandom();
      }
      
      // Generate Legacy P2PKH address (starts with '1')
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: bitcoin.networks.bitcoin,
      });
      
      if (!address) {
        throw new Error('Failed to generate Bitcoin address');
      }
      
      // Convert private key to hex format
      const privateKey = keyPair.privateKey?.toString('hex');
      
      return {
        blockchain: 'Bitcoin',
        platform: 'Bitcoin',
        address,
        privateKey: privateKey ? '0x' + privateKey : undefined,
        walletType: 'Legacy' // Changed from Native SegWit to Legacy
      };
    } catch (error) {
      console.error('Error generating Bitcoin wallet:', error);
      throw new Error('Failed to generate Bitcoin wallet');
    }
  }
};

// Re-export individual functions for backward compatibility
export const generateEthWallet = generateWallet.ethereum;
export const generateSolanaWallet = generateWallet.solana;
export const generateBitcoinWallet = generateWallet.bitcoin;
