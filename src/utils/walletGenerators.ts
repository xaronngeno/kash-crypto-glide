
import { Buffer } from './globalPolyfills';
import { 
  generateRandomSolanaWallet,
  generateRandomEthereumWallet,
  generateRandomBitcoinWallet,
  generateRandomTronWallet,
  generateRandomPolygonWallet 
} from './wallet/chains';
import { 
  generateUnifiedWallets,
  generateWalletsFromSeedPhrase 
} from './wallet/unifiedWalletGenerator';
import { UnifiedWalletData } from './wallet/types';

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Native Segwit"
  seedPhrase?: string; // For returning the seed phrase
}

/**
 * Generate all wallets for a user from a seed phrase
 * The generated wallets will be compatible with external wallet apps
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
      // Get Ethereum wallet first - we'll use it to derive Polygon wallet
      const ethWallet = generateRandomEthereumWallet();
      wallets.push(ethWallet);
      
      // Generate Polygon wallet based on Ethereum wallet
      wallets.push(generateRandomPolygonWallet(ethWallet));
      
      // Add Solana wallet
      wallets.push(generateRandomSolanaWallet());
      
      // Add Tron wallet
      try {
        wallets.push(generateRandomTronWallet());
      } catch (tronError) {
        console.error('Failed to generate Tron wallet:', tronError);
      }
      
      // Add Bitcoin wallet (Native SegWit only)
      try {
        console.log('Attempting to generate Bitcoin wallet');
        const segwitWallet = await generateRandomBitcoinWallet();
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
