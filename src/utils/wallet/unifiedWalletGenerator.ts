
import { ethers } from 'ethers';
import { UnifiedWalletData } from './types';
import { generateSeedPhrase, validateMnemonic } from './seedGenerator';
import { 
  generateEthereumWallet,
  generateSolanaWallet,
  generateBitcoinWallet,
  generateTronWallet,
  generatePolygonWallet
} from './chains';

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
      if (!validateMnemonic(seedPhrase)) {
        throw new Error("Invalid seed phrase provided");
      }
      mnemonic = seedPhrase;
      console.log("Using provided seed phrase");
    } else {
      // Generate a random mnemonic
      mnemonic = generateSeedPhrase();
      
      if (!mnemonic) {
        throw new Error("Failed to generate mnemonic");
      }
      console.log("Generated new seed phrase");
    }
    
    console.log("Generated seed phrase validation:", {
      isValidMnemonic: validateMnemonic(mnemonic)
    });
    
    // Create mnemonic object
    const mnemonicObj = ethers.Mnemonic.fromPhrase(mnemonic);
    const wallets: UnifiedWalletData[] = [];
    
    try {
      // Generate Ethereum wallet
      const ethWallet = generateEthereumWallet(mnemonicObj);
      wallets.push(ethWallet);
      
      // Generate Polygon wallet (using same derivation path as Ethereum)
      const polygonWallet = generatePolygonWallet(mnemonicObj);
      wallets.push(polygonWallet);
      
      // Generate Solana wallet
      const solanaWallet = await generateSolanaWallet(mnemonicObj);
      wallets.push(solanaWallet);
      
      // Generate Bitcoin wallet
      const bitcoinWallet = await generateBitcoinWallet(mnemonicObj);
      wallets.push(bitcoinWallet);
      
      // Generate Tron wallet
      const tronWallet = generateTronWallet(mnemonicObj);
      wallets.push(tronWallet);
    } catch (error) {
      console.error("Error generating individual wallets:", error);
      // Continue with any wallets successfully generated
    }
    
    // Add detailed logging for each wallet generation
    wallets.forEach(wallet => {
      console.log(`${wallet.blockchain} Wallet Generation Details:`, {
        blockchain: wallet.blockchain,
        address: wallet.address,
        addressLength: wallet.address.length
      });
    });
    
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
