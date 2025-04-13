
// Unified wallet generator entry point file
import { WalletData } from './walletConfig';
import { generateWallet } from './wallets';
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
      const solanaWallet = await generateWallet.solana();
      wallets.push(solanaWallet);
      
      // Add Ethereum wallet
      const ethereumWallet = await generateWallet.ethereum();
      wallets.push(ethereumWallet);
      
      // Add Bitcoin wallet (Native SegWit only)
      try {
        console.log('Attempting to generate Bitcoin wallet');
        const bitcoinWallet = await generateWallet.bitcoin();
        wallets.push(bitcoinWallet);
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
  generateWallet
};
