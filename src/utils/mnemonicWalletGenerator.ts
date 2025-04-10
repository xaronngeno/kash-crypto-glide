
import { Buffer } from './globalPolyfills';
import * as bip39 from 'bip39';
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import { derivePath } from 'ed25519-hd-key';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

// Define the derivation paths for different blockchains
const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  BITCOIN: "m/44'/0'/0'/0/0",
  BNB_CHAIN: "m/44'/714'/0'/0/0",
  POLYGON: "m/44'/60'/0'/0/0", // Uses Ethereum path
  AVALANCHE: "m/44'/9000'/0'/0/0",
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
 * Generate or validate a BIP-39 mnemonic phrase
 * @param existingMnemonic Optional existing mnemonic to validate
 * @returns A valid BIP-39 mnemonic phrase
 */
export function getOrCreateMnemonic(existingMnemonic?: string): string {
  if (existingMnemonic) {
    if (!bip39.validateMnemonic(existingMnemonic)) {
      throw new Error('Invalid mnemonic phrase provided');
    }
    return existingMnemonic;
  }
  
  // Generate a new random mnemonic (defaults to 128-bits of entropy)
  return bip39.generateMnemonic();
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
    // Create a wallet from the mnemonic using the specified path
    const wallet = ethers.Wallet.fromPhrase(mnemonic, {
      path: path
    });

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
 * @param existingMnemonic Optional existing mnemonic to use
 * @returns Array of wallet data objects for each blockchain
 */
export async function generateWalletsFromMnemonic(existingMnemonic?: string): Promise<MnemonicWalletData[]> {
  try {
    // Get or create a valid mnemonic
    const mnemonic = getOrCreateMnemonic(existingMnemonic);
    console.log('Using mnemonic to generate wallets');
    
    const wallets: MnemonicWalletData[] = [];
    
    // Generate EVM-compatible wallets (Ethereum, BNB Chain, Polygon, Avalanche)
    wallets.push(generateEVMWallet(mnemonic, DERIVATION_PATHS.ETHEREUM, 'Ethereum'));
    wallets.push(generateEVMWallet(mnemonic, DERIVATION_PATHS.BNB_CHAIN, 'Binance Smart Chain'));
    wallets.push(generateEVMWallet(mnemonic, DERIVATION_PATHS.POLYGON, 'Polygon'));
    wallets.push(generateEVMWallet(mnemonic, DERIVATION_PATHS.MONAD, 'Monad'));
    
    // Generate Solana wallet
    wallets.push(generateSolanaWallet(mnemonic));
    
    // Generate Sui wallet
    wallets.push(generateSuiWallet(mnemonic));
    
    // Bitcoin will be implemented separately due to its complexity
    // Will need bitcoinjs-lib and proper setup
    
    return wallets;
  } catch (error) {
    console.error('Error generating wallets from mnemonic:', error);
    throw new Error(`Failed to generate wallets from mnemonic: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export the mnemonic and derivation paths for reference
export { DERIVATION_PATHS };
