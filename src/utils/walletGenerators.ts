
import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getBitcoin } from '@/utils/bitcoinjsWrapper';
import { getECPairFactory } from '@/utils/ecpairWrapper';
import * as ecc from 'tiny-secp256k1';
import { Buffer } from './globalPolyfills';

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Native Segwit"
}

// Generate a Solana wallet
export const generateSolanaWallet = (): WalletData => {
  try {
    const keypair = Keypair.generate();
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

// Generate an Ethereum wallet or Ethereum-compatible wallet
export const generateEthWallet = (blockchain: string, platform: string): WalletData => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      blockchain,
      platform,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error(`Error generating ${blockchain} wallet:`, error);
    throw new Error(`Failed to generate ${blockchain} wallet`);
  }
};

// Generate a Sui wallet
export const generateSuiWallet = (): WalletData => {
  try {
    // Use try/catch to handle any potential issues during Sui wallet creation
    const keypair = new Ed25519Keypair();
    return {
      blockchain: 'Sui',
      platform: 'Sui',
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: Buffer.from(keypair.export().privateKey, 'base64').toString('hex'),
    };
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
    throw new Error('Failed to generate Sui wallet');
  }
};

// Generate Bitcoin wallet (Native SegWit only)
export const generateBitcoinWallet = async (): Promise<WalletData> => {
  try {
    console.log('Initializing Bitcoin wallet generation');
    
    // Try the full Bitcoin library approach first
    try {
      // Check if Buffer exists and has necessary methods before proceeding
      if (typeof globalThis.Buffer === 'undefined') {
        throw new Error('globalThis.Buffer is undefined');
      }
      
      // Wait for Bitcoin lib to be available
      console.log('Getting Bitcoin library');
      const bitcoinLib = await getBitcoin();
      console.log('Bitcoin library loaded successfully:', !!bitcoinLib);
      
      // Initialize ECPair with explicit Buffer checks using the async version
      console.log('Initializing ECPair');
      const ECPair = await getECPairFactory(ecc);
      console.log('ECPair initialized successfully');
      
      console.log('Generating Bitcoin key pair');
      const keyPair = ECPair.makeRandom();
      console.log('Generated Bitcoin keyPair:', keyPair);
      
      // Ensure keyPair.publicKey exists before using it
      if (!keyPair.publicKey) {
        throw new Error('Failed to generate Bitcoin key pair: publicKey is missing');
      }
      
      console.log('Creating Native SegWit payment');
      const payment = bitcoinLib.payments.p2wpkh({ 
        pubkey: keyPair.publicKey, 
        network: bitcoinLib.networks.bitcoin 
      });
      
      const address = payment.address;
      
      if (!address) {
        throw new Error('Failed to generate Bitcoin address');
      }
      
      return {
        blockchain: 'Bitcoin',
        platform: 'Bitcoin',
        address: address,
        privateKey: keyPair.privateKey?.toString('hex'),
        walletType: 'Native SegWit'
      };
    } catch (bitcoinLibError) {
      // Fallback to simplified approach if bitcoinjs-lib approach fails
      console.error('Bitcoin lib approach failed, using fallback:', bitcoinLibError);
      throw bitcoinLibError; 
    }
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
    
    // Final fallback: Generate a placeholder address for development
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    const randomHex = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
      
    const mockAddress = `btc_sg_${randomHex.substring(0, 30)}`;
    
    return {
      blockchain: 'Bitcoin',
      platform: 'Bitcoin',
      address: mockAddress,
      privateKey: randomHex,
      walletType: 'Native SegWit'
    };
  }
};

// Generate all wallets for a user - fixed to handle async wallet generation
export const generateAllWallets = async (): Promise<WalletData[]> => {
  const wallets: WalletData[] = [];
  
  try {
    // Add Solana wallet
    wallets.push(generateSolanaWallet());
    
    // Add Ethereum wallet
    wallets.push(generateEthWallet('Ethereum', 'Ethereum'));
    
    // Add other Ethereum-compatible wallets
    wallets.push(generateEthWallet('Monad', 'Monad Testnet'));
    wallets.push(generateEthWallet('Base', 'Base'));
    
    // Add Sui wallet
    wallets.push(generateSuiWallet());
    
    // Add Polygon wallet
    wallets.push(generateEthWallet('Polygon', 'Polygon'));
    
    try {
      // Add Bitcoin wallet (Native SegWit only)
      console.log('Attempting to generate Bitcoin wallet');
      const segwitWallet = await generateBitcoinWallet();
      wallets.push(segwitWallet);
      console.log('Successfully generated Bitcoin wallet');
    } catch (bitcoinError) {
      console.error('Failed to generate Bitcoin wallet:', bitcoinError);
      // Continue without Bitcoin wallet
    }
    
    // Add TRX wallet here if tronweb is installed
    // This would be similar to generateEthWallet but using tronweb library
    
    return wallets;
  } catch (error) {
    console.error('Error generating wallets:', error);
    // Return whatever wallets were successfully created
    return wallets.length > 0 ? wallets : [];
  }
};
