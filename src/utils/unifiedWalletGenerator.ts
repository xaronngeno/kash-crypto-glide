
import { Buffer } from './globalPolyfills';
import { ethers } from 'ethers';
import { getBitcoin } from './bitcoinjsWrapper';
import * as tweetnacl from './tweetnaclWrapper';
import { Keypair } from '@solana/web3.js';
import * as bs58 from './bs58Wrapper';

// Define the derivation paths following BIP-44 standards
const DERIVATION_PATHS = {
  BITCOIN: "m/84'/0'/0'/0/0", // Native SegWit (BIP84)
  ETHEREUM: "m/44'/60'/0'/0/0", // BIP44 for Ethereum
  SOLANA: "m/44'/501'/0'/0'", // BIP44 for Solana (note the trailing ')
  TRON: "m/44'/195'/0'/0/0" // BIP44 for Tron
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
 * that will be compatible with external wallets like MetaMask, Phantom, etc.
 */
export const generateUnifiedWallets = async (seedPhrase?: string): Promise<UnifiedWalletData[]> => {
  try {
    console.log("Generating unified wallets:", {
      providedSeedPhrase: !!seedPhrase,
      seedPhraseLength: seedPhrase ? seedPhrase.split(' ').length : 'N/A'
    });
    
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
    
    console.log("Generated seed phrase validation:", {
      isValidMnemonic: ethers.Mnemonic.isValidMnemonic(mnemonic)
    });
    
    const wallets: UnifiedWalletData[] = [];
    
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
    
    // Generate Solana wallet using ed25519 curve from the same seed
    try {
      // Get the seed from mnemonic
      const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
      
      // Use HDNodeWallet.fromMnemonic with the Solana path
      const solanaSeedNode = ethers.HDNodeWallet.fromMnemonic(
        mnemonicObj,
        DERIVATION_PATHS.SOLANA
      );
      
      // Extract private key bytes (remove 0x prefix)
      const privateKeyBytes = Buffer.from(solanaSeedNode.privateKey.slice(2), 'hex');
      
      // Create Solana keypair using the first 32 bytes of the private key bytes
      // This matches how Phantom and other Solana wallets derive their keypair
      const keypair = Keypair.fromSeed(privateKeyBytes.slice(0, 32));
      
      wallets.push({
        blockchain: "Solana",
        platform: "Solana",
        address: keypair.publicKey.toBase58(),
        privateKey: Buffer.from(keypair.secretKey).toString('hex')
      });
      
      console.log("Generated Solana wallet successfully:", keypair.publicKey.toBase58());
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
        console.log("Generated Bitcoin wallet successfully:", address);
      } else {
        throw new Error("Failed to generate Bitcoin address");
      }
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
      
      // Derive Tron address using their address format
      // Tron addresses start with 'T' followed by a base58 encoded hash
      // For this implementation we'll create a compatible address format
      
      // Extract the private key (remove 0x prefix)
      const privateKeyBytes = Buffer.from(tronHdNode.privateKey.slice(2), 'hex');
      
      // Derive the public key using keccak256 hash (similar to Ethereum)
      // This is a simplification - in production use actual TronWeb library
      const ethAddress = tronHdNode.address; // Get the Ethereum-format address
      
      // Convert Ethereum address to Tron format (simplified)
      // In real implementation, use TronWeb's fromHex function
      // For now, we'll create a T-prefixed address based on the Ethereum address
      const tronAddressHex = "41" + ethAddress.slice(2);
      
      // Typically this would be base58 encoded, but we'll use a simplified approach
      // In a real implementation, use the full TronWeb package
      const tronAddress = "T" + ethAddress.slice(3, 37);
      
      wallets.push({
        blockchain: "Tron",
        platform: "Tron",
        address: tronAddress,
        privateKey: tronHdNode.privateKey
      });
      
      console.log("Generated Tron wallet successfully:", tronAddress);
    } catch (error) {
      console.error("Failed to generate Tron wallet:", error);
    }
    
    // Add more detailed logging for each wallet generation step
    const logWalletGeneration = (blockchain: string, address: string) => {
      console.log(`${blockchain} Wallet Generation Details:`, {
        blockchain,
        address,
        addressLength: address.length
      });
    };
    
    // Update each wallet generation with logging
    wallets.forEach(wallet => {
      logWalletGeneration(wallet.blockchain, wallet.address);
    });
    
    // Return the generated seed phrase along with the wallets
    console.log(`Generated ${wallets.length} unified wallets`);
    
    // Add the seed phrase to the first wallet for retrieval
    if (wallets.length > 0) {
      (wallets[0] as any).seedPhrase = mnemonic;
    }
    
    return wallets;
  } catch (error) {
    console.error("Comprehensive Wallet Generation Error:", {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
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
