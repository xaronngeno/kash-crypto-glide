
import { useState } from 'react';
import { generateWalletsFromSeed, generateUnifiedWallets } from '@/utils/hdWallet';
import { WalletData } from '@/utils/walletConfig';

/**
 * Hook for generating new wallets
 */
export const useWalletGenerator = () => {
  const [loading, setLoading] = useState(false);
  
  /**
   * Generate new wallets for testing or other purposes
   */
  const generateNewWallets = async (seedPhrase?: string): Promise<WalletData[]> => {
    try {
      setLoading(true);
      
      // Use existing seed phrase or generate new wallets
      const wallets = seedPhrase 
        ? await generateWalletsFromSeed(seedPhrase)
        : await generateUnifiedWallets();
        
      return wallets;
    } catch (error) {
      console.error('Error generating new wallets:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    generateNewWallets,
    loading
  };
};
