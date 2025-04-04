
import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { bitcoin, getBitcoin } from '@/utils/bitcoinjsWrapper';
import { ECPairFactory } from '@/utils/ecpairWrapper';
import * as ecc from 'tiny-secp256k1';

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Taproot" or "Native Segwit"
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

// Generate Bitcoin wallets
export const generateBitcoinWallet = async (type: 'taproot' | 'segwit'): Promise<WalletData> => {
  try {
    console.log('Initializing Bitcoin wallet generation');
    
    // Make sure the Buffer is properly defined before proceeding
    if (typeof globalThis.Buffer === 'undefined' || 
        typeof globalThis.Buffer.alloc !== 'function' ||
        typeof globalThis.Buffer.from !== 'function') {
      console.error('Buffer is not properly defined');
      throw new Error('Buffer polyfill is not properly loaded');
    }
    
    // Get the initialized bitcoin library
    const bitcoinLib = getBitcoin();
    console.log('Bitcoin library loaded:', !!bitcoinLib);
    
    // Initialize ECPair
    let ECPair;
    try {
      ECPair = ECPairFactory(ecc);
      console.log('ECPair initialized successfully');
    } catch (ecpairError) {
      console.error('Failed to initialize ECPair:', ecpairError);
      throw new Error('Could not initialize Bitcoin key generation');
    }
    
    console.log('Generating Bitcoin key pair');
    const keyPair = ECPair.makeRandom();
    console.log('Generated Bitcoin keyPair:', keyPair);
    
    // Ensure keyPair.publicKey exists before using it
    if (!keyPair.publicKey) {
      throw new Error('Failed to generate Bitcoin key pair');
    }
    
    let address: string | undefined;
    
    if (type === 'taproot') {
      console.log('Creating Taproot payment');
      const payment = bitcoinLib.payments.p2tr({ 
        internalPubkey: keyPair.publicKey.slice(1, 33),
        network: bitcoinLib.networks.bitcoin 
      });
      address = payment.address;
    } else {
      console.log('Creating SegWit payment');
      const payment = bitcoinLib.payments.p2wpkh({ 
        pubkey: keyPair.publicKey, 
        network: bitcoinLib.networks.bitcoin 
      });
      address = payment.address;
    }
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    return {
      blockchain: 'Bitcoin',
      platform: 'Bitcoin',
      address: address,
      privateKey: keyPair.privateKey?.toString('hex'),
      walletType: type === 'taproot' ? 'Taproot' : 'Native SegWit'
    };
  } catch (error) {
    console.error(`Error generating Bitcoin ${type} wallet:`, error);
    throw new Error(`Failed to generate Bitcoin ${type} wallet: ${error instanceof Error ? error.message : String(error)}`);
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
      // Try to generate Bitcoin wallets, but don't fail the entire function if they fail
      console.log('Attempting to generate Bitcoin wallets');
      
      const taprootWallet = await generateBitcoinWallet('taproot');
      wallets.push(taprootWallet);
      
      const segwitWallet = await generateBitcoinWallet('segwit');
      wallets.push(segwitWallet);
      
      console.log('Successfully generated Bitcoin wallets');
    } catch (bitcoinError) {
      console.error('Failed to generate Bitcoin wallets:', bitcoinError);
      // Continue without Bitcoin wallets
    }
    
    return wallets;
  } catch (error) {
    console.error('Error generating wallets:', error);
    // Return whatever wallets were successfully created
    return wallets.length > 0 ? wallets : [];
  }
};
