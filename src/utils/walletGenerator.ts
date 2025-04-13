
import { Buffer } from './globalPolyfills';
import { ethers } from 'ethers';
import { getBitcoin } from './bitcoinjsWrapper';
import { Keypair } from '@solana/web3.js';
import * as bs58 from './bs58Wrapper';
import { getECPairFactory } from './ecpairWrapper';
import * as ecc from 'tiny-secp256k1';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';

// Define the derivation paths following BIP-44 standards
const DERIVATION_PATHS = {
  BITCOIN: "m/84'/0'/0'/0/0", // Native SegWit (BIP84)
  ETHEREUM: "m/44'/60'/0'/0/0", // BIP44 for Ethereum
  SOLANA: "m/44'/501'/0'/0'", // BIP44 for Solana (note the trailing ')
  TRON: "m/44'/195'/0'/0/0" // BIP44 for Tron
};

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Native Segwit"
  seedPhrase?: string; // For returning the seed phrase
}

// Generate all wallets for a user from a seed phrase
export const generateWalletsFromSeed = async (seedPhrase: string): Promise<WalletData[]> => {
  try {
    console.log('Generating wallets from seed phrase');
    return await generateWalletsFromSeedPhrase(seedPhrase);
  } catch (error) {
    console.error('Error generating wallets from seed phrase:', error);
    throw error;
  }
};

// Generate all wallets for a user - unified approach with fallback to individual generators
export const generateAllWallets = async (): Promise<WalletData[]> => {
  try {
    console.log('Starting unified wallet generation');
    // Use the unified approach (HD wallet from same seed)
    const unifiedWallets = await generateUnifiedWallets();
    console.log(`Successfully generated ${unifiedWallets.length} unified wallets`);
    
    // Extract and return the seed phrase from the first wallet
    const seedPhrase = (unifiedWallets[0] as any).seedPhrase;
    console.log(`Seed phrase ${seedPhrase ? 'generated' : 'not available'}`);
    
    // Remove the seed phrase property from wallet objects before returning
    return unifiedWallets.map(wallet => {
      const { seedPhrase, ...rest } = wallet as any;
      return rest;
    });
  } catch (unifiedError) {
    console.error('Unified wallet generation failed:', unifiedError);
    console.log('Falling back to individual wallet generators');
    
    // Fallback to individual wallet generators
    const wallets: WalletData[] = [];
    
    try {
      // Add Solana wallet
      wallets.push(generateSolanaWallet());
      
      // Add Ethereum wallet
      wallets.push(generateEthWallet('Ethereum', 'Ethereum'));
      
      // Add Tron wallet
      try {
        wallets.push(generateTronWallet());
      } catch (tronError) {
        console.error('Failed to generate Tron wallet:', tronError);
      }
      
      // Add Bitcoin wallet (Native SegWit only)
      try {
        console.log('Attempting to generate Bitcoin wallet');
        const segwitWallet = await generateBitcoinWallet();
        wallets.push(segwitWallet);
        console.log('Successfully generated Bitcoin wallet');
      } catch (bitcoinError) {
        console.error('Failed to generate Bitcoin wallet:', bitcoinError);
        // Continue without Bitcoin wallet
      }
      
      return wallets;
    } catch (error) {
      console.error('Error generating wallets:', error);
      // Return whatever wallets were successfully created
      return wallets.length > 0 ? wallets : [];
    }
  }
};

// New function to extract the seed phrase from generated wallets
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
      const keypair = Keypair.fromSeed(solDerivation.key);

      wallets.push({
        blockchain: "Solana",
        platform: "Solana",
        address: keypair.publicKey.toBase58(),
        privateKey: bs58.encode(keypair.secretKey)
      });
      
      console.log("Generated Solana wallet successfully with ed25519 derivation");
    } catch (error) {
      console.error("Failed to generate Solana wallet:", error);
    }
    
    // Generate Bitcoin wallet (Native SegWit - BIP84)
    try {
      // Import bitcoinjs-lib dynamically to ensure Buffer is available
      const bitcoin = await getBitcoin();
      
      // Get the Bitcoin node using BIP84 derivation path for SegWit
      const bitcoinHdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        DERIVATION_PATHS.BITCOIN
      );
      
      // Convert private key to buffer (removing 0x prefix)
      const privateKeyBuffer = Buffer.from(bitcoinHdNode.privateKey.slice(2), 'hex');
      
      // Get ECPair factory using the wrapper - this fixes the import issue
      const ECPair = await getECPairFactory(ecc);
      
      // Generate key pair from private key
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer);
      
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
        privateKey: bitcoinHdNode.privateKey,
        walletType: "Native SegWit"
      });
      console.log("Generated Bitcoin wallet successfully");
    } catch (error) {
      console.error("Failed to generate Bitcoin wallet:", error);
    }

    // Generate Tron wallet
    try {
      // Use HDNodeWallet.fromMnemonic with the Tron path
      const tronHdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        DERIVATION_PATHS.TRON
      );
      
      // Extract the private key (remove 0x prefix)
      const privateKeyBytes = Buffer.from(tronHdNode.privateKey.slice(2), 'hex');
      
      // Derive the public key using keccak256 hash (similar to Ethereum)
      // This is a simplification - in production use actual TronWeb library
      const ethAddress = tronHdNode.address; // Get the Ethereum-format address
      
      // Convert Ethereum address to Tron format (simplified)
      const tronAddress = "T" + ethAddress.slice(3, 37);
      
      wallets.push({
        blockchain: "Tron",
        platform: "Tron",
        address: tronAddress,
        privateKey: tronHdNode.privateKey
      });
      
      console.log("Generated Tron wallet successfully");
    } catch (error) {
      console.error("Failed to generate Tron wallet:", error);
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
 * Individual wallet generation functions
 * These are kept for backward compatibility and fallback scenarios
 */

// Generate a Solana wallet
export const generateSolanaWallet = (privateKeyHex?: string, seedPhrase?: string): WalletData => {
  try {
    let keypair: Keypair;
    
    if (seedPhrase) {
      // Derive Solana keypair from seed phrase using proper ed25519 derivation
      console.log("Generating Solana wallet from seed phrase with ed25519 derivation");
      const seed = bip39.mnemonicToSeedSync(seedPhrase);
      const derived = derivePath(DERIVATION_PATHS.SOLANA, seed.toString('hex')).key;
      keypair = Keypair.fromSeed(new Uint8Array(derived));
      console.log("Created Solana wallet from seed phrase with proper derivation");
    } else if (privateKeyHex) {
      // Convert hex string to Uint8Array for Solana keypair
      // For ed25519, we need the full 64-byte secret key (32 bytes private + 32 bytes public)
      // If we have just the 32-byte private key, we need to create a proper secret key
      let secretKey: Uint8Array;
      
      if (privateKeyHex.startsWith('0x')) {
        privateKeyHex = privateKeyHex.substring(2);
      }
      
      const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
      
      // Check if we have a 32-byte private key or a 64-byte secret key
      if (privateKeyBytes.length === 32) {
        // We have a 32-byte private key, create a proper 64-byte secret key
        // This is a simplified approach - in production, derivation should use ed25519-hd-key
        secretKey = new Uint8Array(64);
        secretKey.set(privateKeyBytes);
        
        // The public key part will be auto-derived by the Keypair constructor
        keypair = Keypair.fromSeed(privateKeyBytes);
      } else if (privateKeyBytes.length === 64) {
        // We have a full secret key (private + public parts)
        keypair = Keypair.fromSecretKey(privateKeyBytes);
      } else {
        throw new Error(`Invalid Solana private key length: ${privateKeyBytes.length} bytes`);
      }
      
      console.log("Created Solana wallet from provided private key");
    } else {
      // Generate a random keypair
      keypair = Keypair.generate();
      console.log("Generated random Solana wallet");
    }
    
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

// Generate an Ethereum wallet
export const generateEthWallet = (blockchain = 'Ethereum', platform = 'Ethereum'): WalletData => {
  try {
    // Create a random Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey;
    
    return {
      blockchain,
      platform,
      address,
      privateKey
    };
  } catch (error) {
    console.error('Error generating ETH wallet:', error);
    throw new Error(`Failed to generate ${blockchain} wallet`);
  }
};

// Generate a Bitcoin wallet
export const generateBitcoinWallet = async (): Promise<WalletData> => {
  try {
    // Get Bitcoin module
    const bitcoin = await getBitcoin();
    
    // Create a random key pair
    const ECPair = await getECPairFactory(ecc);
    const keyPair = ECPair.makeRandom();
    
    // Native SegWit (P2WPKH)
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: bitcoin.networks.bitcoin,
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    // Convert private key to WIF format
    const privateKey = keyPair.privateKey?.toString('hex');
    
    return {
      blockchain: 'Bitcoin',
      platform: 'Bitcoin',
      address,
      privateKey: privateKey ? '0x' + privateKey : undefined,
      walletType: 'Native SegWit'
    };
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
    throw new Error('Failed to generate Bitcoin wallet');
  }
};

// Generate a Tron wallet
export const generateTronWallet = (): WalletData => {
  try {
    // Create a random Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    const ethAddress = wallet.address;
    const privateKey = wallet.privateKey;
    
    // Convert Ethereum address to Tron format (simplified approach)
    // Real implementation should use TronWeb library
    const tronAddress = 'T' + ethAddress.slice(3);
    
    return {
      blockchain: 'Tron',
      platform: 'Tron',
      address: tronAddress,
      privateKey
    };
  } catch (error) {
    console.error('Error generating Tron wallet:', error);
    throw new Error('Failed to generate Tron wallet');
  }
};
