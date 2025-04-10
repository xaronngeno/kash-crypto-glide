
import { Keypair } from '@solana/web3.js';
import { ethers } from 'ethers';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { getBitcoin } from '@/utils/bitcoinjsWrapper';
import { getECPairFactory } from '@/utils/ecpairWrapper';
import * as ecc from 'tiny-secp256k1';
import { Buffer } from './globalPolyfills';
import * as bip39 from 'bip39';

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Taproot" or "Native Segwit"
  derivationPath?: string; // Added derivation path
}

// Define the derivation paths for different blockchains
export const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  BITCOIN: "m/44'/0'/0'/0/0",
  SUI: "m/44'/784'/0'/0'/0'",
  TRON: "m/44'/195'/0'/0/0",
  MONAD: "m/44'/60'/0'/0/0", // Uses Ethereum path as Monad is EVM-compatible
};

// Generate a Solana wallet
export const generateSolanaWallet = (): WalletData => {
  try {
    console.log('Generating Solana wallet');
    const keypair = Keypair.generate();
    const address = keypair.publicKey.toString();
    console.log(`Generated Solana wallet with address: ${address}`);
    
    return {
      blockchain: 'Solana',
      platform: 'Solana',
      address: address,
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
      derivationPath: DERIVATION_PATHS.SOLANA,
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw new Error('Failed to generate Solana wallet');
  }
};

// Generate an Ethereum wallet or Ethereum-compatible wallet
export const generateEthWallet = (blockchain: string, platform: string): WalletData => {
  try {
    console.log(`Generating ${blockchain} wallet`);
    const wallet = ethers.Wallet.createRandom();
    let derivationPath = DERIVATION_PATHS.ETHEREUM;
    
    // Use appropriate derivation path based on blockchain
    if (blockchain.toLowerCase() === 'monad') {
      derivationPath = DERIVATION_PATHS.MONAD;
    }
    
    console.log(`Generated ${blockchain} wallet with address: ${wallet.address}`);
    return {
      blockchain,
      platform,
      address: wallet.address,
      privateKey: wallet.privateKey,
      derivationPath,
    };
  } catch (error) {
    console.error(`Error generating ${blockchain} wallet:`, error);
    throw new Error(`Failed to generate ${blockchain} wallet`);
  }
};

// Generate a Sui wallet
export const generateSuiWallet = (): WalletData => {
  try {
    console.log('Generating Sui wallet');
    // Use try/catch to handle any potential issues during Sui wallet creation
    const keypair = new Ed25519Keypair();
    const address = keypair.getPublicKey().toSuiAddress();
    console.log(`Generated Sui wallet with address: ${address}`);
    
    return {
      blockchain: 'Sui',
      platform: 'Sui',
      address: address,
      privateKey: Buffer.from(keypair.export().privateKey, 'base64').toString('hex'),
      derivationPath: DERIVATION_PATHS.SUI,
    };
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
    throw new Error('Failed to generate Sui wallet');
  }
};

// Generate Tron wallet
export const generateTronWallet = (): WalletData => {
  try {
    console.log('Generating Tron wallet');
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();
    
    // For Tron address format, we create a simple mock
    const address = `T${wallet.address.substring(2)}`;
    console.log(`Generated Tron wallet with address: ${address}`);
    
    return {
      blockchain: 'Tron',
      platform: 'Tron',
      address: address,
      privateKey: wallet.privateKey,
      derivationPath: DERIVATION_PATHS.TRON,
    };
  } catch (error) {
    console.error('Error generating Tron wallet:', error);
    throw new Error('Failed to generate Tron wallet');
  }
};

// Generate Bitcoin wallets
export const generateBitcoinWallet = async (type: 'taproot' | 'segwit'): Promise<WalletData> => {
  try {
    console.log(`Initializing Bitcoin ${type} wallet generation`);
    
    // Check if Buffer exists and has necessary methods before proceeding
    if (typeof globalThis.Buffer === 'undefined') {
      throw new Error('globalThis.Buffer is undefined');
    }
    
    if (typeof globalThis.Buffer.alloc !== 'function') {
      throw new Error('globalThis.Buffer.alloc is not a function');
    }
    
    if (typeof globalThis.Buffer.from !== 'function') {
      throw new Error('globalThis.Buffer.from is not a function');
    }
    
    // Test that Buffer actually works
    try {
      const testBuffer = globalThis.Buffer.alloc(1);
      const testBuffer2 = globalThis.Buffer.from([1, 2, 3]);
      console.log('Buffer test successful:', testBuffer, testBuffer2);
    } catch (bufferError) {
      console.error('Buffer test failed:', bufferError);
      throw new Error('Buffer methods exist but fail when called');
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
    
    console.log(`Generated Bitcoin ${type} wallet with address: ${address}`);
    
    return {
      blockchain: 'Bitcoin',
      platform: 'Bitcoin',
      address: address,
      privateKey: keyPair.privateKey?.toString('hex'),
      walletType: type === 'taproot' ? 'Taproot' : 'Native SegWit',
      derivationPath: DERIVATION_PATHS.BITCOIN,
    };
  } catch (error) {
    console.error(`Error generating Bitcoin ${type} wallet:`, error);
    throw new Error(`Failed to generate Bitcoin ${type} wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Generate or validate a mnemonic
export const getOrCreateMnemonic = (existingMnemonic?: string): string => {
  if (existingMnemonic) {
    if (!bip39.validateMnemonic(existingMnemonic)) {
      throw new Error('Invalid mnemonic phrase provided');
    }
    return existingMnemonic;
  }
  
  // Generate a new random mnemonic (defaults to 128-bits of entropy)
  return bip39.generateMnemonic();
};

// Generate all wallets for a user - fixed to handle async wallet generation
export const generateAllWallets = async (): Promise<WalletData[]> => {
  const wallets: WalletData[] = [];
  
  try {
    // Create a mnemonic for all wallets
    const mnemonic = getOrCreateMnemonic();
    console.log('Generated mnemonic for HD wallet generation');
    
    console.log('Starting to generate all wallets...');
    
    // Add Ethereum wallet
    try {
      const ethWallet = generateEthWallet('Ethereum', 'Ethereum');
      wallets.push(ethWallet);
      console.log('Added Ethereum wallet');
    } catch (error) {
      console.error('Failed to generate Ethereum wallet:', error);
    }
    
    // Add Solana wallet
    try {
      const solanaWallet = generateSolanaWallet();
      wallets.push(solanaWallet);
      console.log('Added Solana wallet');
    } catch (error) {
      console.error('Failed to generate Solana wallet:', error);
    }
    
    // Add other Ethereum-compatible wallets
    try {
      const monadWallet = generateEthWallet('Monad', 'Monad Testnet');
      wallets.push(monadWallet);
      console.log('Added Monad wallet');
    } catch (error) {
      console.error('Failed to generate Monad wallet:', error);
    }
    
    // Add Tron wallet
    try {
      const tronWallet = generateTronWallet();
      wallets.push(tronWallet);
      console.log('Added Tron wallet');
    } catch (error) {
      console.error('Failed to generate Tron wallet:', error);
    }
    
    // Add Sui wallet
    try {
      const suiWallet = generateSuiWallet();
      wallets.push(suiWallet);
      console.log('Added Sui wallet');
    } catch (error) {
      console.error('Failed to generate Sui wallet:', error);
    }
    
    try {
      // Try to generate Bitcoin wallets, but don't fail the entire function if they fail
      console.log('Attempting to generate Bitcoin wallets');
      
      const taprootWallet = await generateBitcoinWallet('taproot');
      wallets.push(taprootWallet);
      console.log('Added Bitcoin Taproot wallet');
      
      const segwitWallet = await generateBitcoinWallet('segwit');
      wallets.push(segwitWallet);
      console.log('Added Bitcoin SegWit wallet');
    } catch (bitcoinError) {
      console.error('Failed to generate Bitcoin wallets:', bitcoinError);
      // Continue without Bitcoin wallets
    }
    
    console.log(`Successfully generated ${wallets.length} wallets`);
    return wallets;
  } catch (error) {
    console.error('Error in generateAllWallets:', error);
    // Return whatever wallets were successfully created
    return wallets.length > 0 ? wallets : [];
  }
};
