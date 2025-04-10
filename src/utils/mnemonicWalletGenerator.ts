
import { Buffer } from './globalPolyfills';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import CryptoJS from 'crypto-js';

// Define the derivation paths for different blockchains
const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  TRON: "m/44'/195'/0'/0/0",
  SUI: "m/44'/784'/0'/0'/0'",
  MONAD: "m/44'/60'/0'/0/0", // Uses Ethereum path as Monad is EVM-compatible
};

// Interface for WalletData
export interface MnemonicWalletData {
  blockchain: string;
  address: string;
  privateKey: string;
  path: string;
}

/**
 * Generate or validate a BIP-39 mnemonic phrase with higher entropy for uniqueness
 * @param existingMnemonic Optional existing mnemonic to validate
 * @param wordCount Number of words in the mnemonic (12, 15, 18, 21, or 24)
 * @returns A valid BIP-39 mnemonic phrase
 */
export function getOrCreateMnemonic(existingMnemonic?: string, wordCount: number = 24): string {
  if (existingMnemonic) {
    if (!bip39.validateMnemonic(existingMnemonic)) {
      throw new Error('Invalid mnemonic phrase provided');
    }
    return existingMnemonic;
  }
  
  // Calculate entropy bits based on word count (24 words = 256 bits)
  // Using 24 words instead of 12 for higher entropy and better uniqueness
  const entropyBits = wordCount === 12 ? 128 : 256;
  
  // Generate a new random mnemonic with specified entropy
  return bip39.generateMnemonic(entropyBits);
}

/**
 * Generate an Ethereum-compatible wallet from a mnemonic
 * @param mnemonic BIP-39 mnemonic phrase
 * @param path Derivation path
 * @param blockchain Blockchain name
 * @returns Wallet data object with address and private key
 */
export function generateEVMWallet(
  mnemonic: string, 
  path: string, 
  blockchain: string
): MnemonicWalletData {
  try {
    // Create wallet properly from mnemonic with derivation path
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);

    return {
      blockchain,
      address: wallet.address,
      privateKey: wallet.privateKey,
      path,
    };
  } catch (error) {
    console.error(`Error generating ${blockchain} wallet:`, error);
    throw new Error(`Failed to generate ${blockchain} wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a Solana wallet from a mnemonic
 * @param mnemonic BIP-39 mnemonic phrase
 * @returns Wallet data object with address and private key
 */
export function generateSolanaWallet(mnemonic: string): MnemonicWalletData {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Derive the keypair from the seed using the Solana path
    const { key } = derivePath(DERIVATION_PATHS.SOLANA, seed.toString('hex'));
    
    // Create a Solana keypair from the derived key
    const keypair = Keypair.fromSeed(key);

    return {
      blockchain: 'Solana',
      address: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
      path: DERIVATION_PATHS.SOLANA,
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw new Error(`Failed to generate Solana wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a Tron wallet from a mnemonic
 * @param mnemonic BIP-39 mnemonic phrase
 * @returns Wallet data object with address and private key
 */
export function generateTronWallet(mnemonic: string): MnemonicWalletData {
  try {
    // Use ETH derivation with TRON path
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, DERIVATION_PATHS.TRON);
    
    // For compatibility with TronWeb, we extract the private key
    const privateKey = wallet.privateKey.slice(2); // Remove '0x' prefix
    
    // Create Tron address format (T + address without 0x)
    const tronAddress = `T${wallet.address.slice(2)}`;
    
    return {
      blockchain: 'Tron',
      address: tronAddress,
      privateKey: privateKey,
      path: DERIVATION_PATHS.TRON,
    };
  } catch (error) {
    console.error('Error generating Tron wallet:', error);
    throw new Error(`Failed to generate Tron wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a Sui wallet from a mnemonic
 * @param mnemonic BIP-39 mnemonic phrase
 * @returns Wallet data object with address and private key
 */
export function generateSuiWallet(mnemonic: string): MnemonicWalletData {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Derive the keypair from the seed using the Sui path
    const { key } = derivePath(DERIVATION_PATHS.SUI, seed.toString('hex'));
    
    // Create keypair from the derived key with correct type handling
    const keyData = {
      publicKey: new Uint8Array(32),
      secretKey: key.slice(0, 32)
    };
    
    const keypair = new Ed25519Keypair(keyData);

    return {
      blockchain: 'Sui',
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: Buffer.from(keyData.secretKey).toString('hex'),
      path: DERIVATION_PATHS.SUI,
    };
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
    throw new Error(`Failed to generate Sui wallet: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate wallet addresses for all supported blockchains from a single mnemonic
 * Uses 24-word mnemonics by default for increased entropy and uniqueness
 * @param existingMnemonic Optional existing mnemonic to use
 * @returns Array of wallet data objects for each blockchain
 */
export async function generateWalletsFromMnemonic(existingMnemonic?: string): Promise<MnemonicWalletData[]> {
  try {
    // Get or create a valid 24-word mnemonic (instead of 12) for more uniqueness
    const mnemonic = getOrCreateMnemonic(existingMnemonic, 24);
    console.log('Using mnemonic to generate wallets');
    
    const wallets: MnemonicWalletData[] = [];
    
    // Generate EVM-compatible wallets (Ethereum, Monad)
    wallets.push(generateEVMWallet(mnemonic, DERIVATION_PATHS.ETHEREUM, 'Ethereum'));
    wallets.push(generateEVMWallet(mnemonic, DERIVATION_PATHS.MONAD, 'Monad'));
    
    // Generate Solana wallet
    wallets.push(generateSolanaWallet(mnemonic));
    
    // Generate Tron wallet
    wallets.push(generateTronWallet(mnemonic));
    
    // Generate Sui wallet
    wallets.push(generateSuiWallet(mnemonic));
    
    return wallets;
  } catch (error) {
    console.error('Error generating wallets from mnemonic:', error);
    throw new Error(`Failed to generate wallets from mnemonic: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Securely encrypt a mnemonic phrase with a password
 * @param mnemonic The mnemonic phrase to encrypt
 * @param password Password for encryption
 * @returns Encrypted mnemonic string
 */
export function encryptMnemonic(mnemonic: string, password: string): string {
  return CryptoJS.AES.encrypt(mnemonic, password).toString();
}

/**
 * Decrypt an encrypted mnemonic phrase with a password
 * @param encryptedMnemonic The encrypted mnemonic string
 * @param password Password for decryption
 * @returns Decrypted mnemonic phrase
 */
export function decryptMnemonic(encryptedMnemonic: string, password: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Export the mnemonic and derivation paths for reference
export { DERIVATION_PATHS };
