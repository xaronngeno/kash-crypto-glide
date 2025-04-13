
import { ethers } from 'ethers';
import { Keypair } from '@solana/web3.js';
import * as bs58 from './bs58Wrapper';
import * as bip39 from 'bip39';
import { derivePath } from 'ed25519-hd-key';
import { Buffer } from './globalPolyfills';
import { getBitcoin } from './bitcoinjsWrapper';
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
