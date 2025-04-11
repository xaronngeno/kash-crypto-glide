
import { Buffer } from './globalPolyfills';
import { ethers } from 'ethers';
import { getBitcoin } from './bitcoinjsWrapper';
import * as tweetnacl from './tweetnaclWrapper';
import { Keypair } from '@solana/web3.js';

// Define the derivation paths following BIP-44 standards
const DERIVATION_PATHS = {
  BITCOIN: "m/84'/0'/0'/0/0", // Native SegWit (BIP84)
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'"
};

// Interface for wallet data
export interface UnifiedWalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string;
  walletType?: string;
}

/**
 * Generate unified wallets with ethers built-in HD wallet functionality
 * This approach ensures consistent derivation of addresses from a seed phrase
 */
export const generateUnifiedWallets = async (seedPhrase?: string): Promise<UnifiedWalletData[]> => {
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
    
    const wallets: UnifiedWalletData[] = [];
    
    // Generate Ethereum wallet
    const ethHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.ETHEREUM
    );
    
    // Ethereum wallet
    wallets.push({
      blockchain: "Ethereum",
      platform: "Ethereum",
      address: ethHdNode.address,
      privateKey: ethHdNode.privateKey
    });
    
    // Generate Solana wallet using the proper derivation method
    try {
      // Use standard Solana derivation path to get the keypair
      const solanaHdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        DERIVATION_PATHS.SOLANA
      );
      
      // Get bytes from the private key (remove 0x prefix)
      const privateKeyBytes = Buffer.from(solanaHdNode.privateKey.slice(2), 'hex');
      
      // Create Solana keypair from the seed
      const keypair = Keypair.fromSeed(privateKeyBytes.slice(0, 32));
      
      wallets.push({
        blockchain: "Solana",
        platform: "Solana",
        address: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('hex')
      });
      
      console.log("Generated Solana wallet successfully");
    } catch (error) {
      console.error("Failed to generate Solana wallet:", error);
    }
    
    // Generate Bitcoin wallet (Native SegWit - BIP84)
    try {
      // Import bitcoinjs-lib dynamically to ensure Buffer is available
      const bitcoin = await getBitcoin();
      
      const bitcoinHdNode = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        DERIVATION_PATHS.BITCOIN
      );
      
      // Convert to WIF and derive Native SegWit address
      const privateKeyBuffer = Buffer.from(bitcoinHdNode.privateKey.slice(2), 'hex');
      
      // Generate a P2WPKH (Native SegWit) address
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(bitcoinHdNode.publicKey.slice(2), 'hex'),
        network: bitcoin.networks.bitcoin
      });
      
      if (address) {
        wallets.push({
          blockchain: "Bitcoin",
          platform: "Bitcoin",
          address: address,
          privateKey: bitcoinHdNode.privateKey,
          walletType: "Native SegWit"
        });
        console.log("Generated Bitcoin wallet successfully");
      } else {
        throw new Error("Failed to generate Bitcoin address");
      }
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
export const generateWalletsFromSeedPhrase = async (seedPhrase: string): Promise<UnifiedWalletData[]> => {
  return generateUnifiedWallets(seedPhrase);
};
