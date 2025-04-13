
import { Buffer } from './globalPolyfills';
import { WalletData } from './types/wallet';
import { generateSolanaWallet } from './wallets/solana';
import { generateEthWallet, generateTronWallet } from './wallets/ethereum';
import { generateBitcoinWallet } from './wallets/bitcoin';
import { 
  generateUnifiedWallets, 
  generateWalletsFromSeed, 
  extractSeedPhrase, 
  generateWalletsFromSeedPhrase 
} from './hdWallet';

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

// Re-export all functions for backward compatibility
export {
  generateWalletsFromSeed,
  extractSeedPhrase,
  generateUnifiedWallets,
  generateWalletsFromSeedPhrase,
  generateSolanaWallet,
  generateEthWallet,
  generateTronWallet,
  generateBitcoinWallet
};
