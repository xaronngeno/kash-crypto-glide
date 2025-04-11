
import { Buffer } from './globalPolyfills';
import { generateSolanaWallet } from './wallets/solanaWalletGenerator';
import { generateEthWallet } from './wallets/ethWalletGenerator';
import { generateSuiWallet } from './wallets/suiWalletGenerator';
import { generateBitcoinWallet } from './wallets/bitcoinWalletGenerator';
import { generateUnifiedWallets, UnifiedWalletData } from './unifiedWalletGenerator';

// Interface for wallet data
export interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string; // Only passed temporarily, never stored on frontend
  walletType?: string; // For different wallet types like "Native Segwit"
}

// Generate all wallets for a user - unified approach with fallback to individual generators
export const generateAllWallets = async (): Promise<WalletData[]> => {
  // Try the unified approach first (HD wallet from same seed)
  try {
    console.log('Attempting unified wallet generation');
    const unifiedWallets = await generateUnifiedWallets();
    console.log(`Successfully generated ${unifiedWallets.length} unified wallets`);
    return unifiedWallets;
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
      
      // Add other Ethereum-compatible wallets
      wallets.push(generateEthWallet('Monad', 'Monad Testnet'));
      wallets.push(generateEthWallet('Base', 'Base'));
      
      // Add Sui wallet
      wallets.push(generateSuiWallet());
      
      // Add Polygon wallet
      wallets.push(generateEthWallet('Polygon', 'Polygon'));
      
      try {
        // Add Bitcoin wallet (Native SegWit only)
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
