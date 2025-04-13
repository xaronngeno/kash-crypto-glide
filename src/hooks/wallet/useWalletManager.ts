
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WalletData } from '@/utils/walletConfig';
import { useSeedPhrase } from './useSeedPhrase';
import { useWalletValidator } from './useWalletValidator';
import { useWalletGenerator } from './useWalletGenerator';
import { createUserWallets } from './createUserWallets';

export { createUserWallets };

export const useWalletManager = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletsCreated, setWalletsCreated] = useState(false);
  const { toast } = useToast();

  // Use the extracted hooks
  const { seedPhrase, fetchSeedPhrase, clearSeedPhrase } = useSeedPhrase(userId);
  const { validateSeedPhrase } = useWalletValidator(userId);
  const { generateNewWallets } = useWalletGenerator();

  /**
   * Creates wallets for a user if they don't exist
   */
  const createUserWalletsInternal = async (userId: string): Promise<WalletData[] | null> => {
    if (!userId) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const wallets = await createUserWallets(userId);
      if (wallets && wallets.length > 0) {
        setWalletsCreated(true);
      }
      return wallets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
      setError(errorMessage);
      toast({
        title: "Error creating wallets",
        description: "Please try again later",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createUserWallets: createUserWalletsInternal,
    fetchSeedPhrase,
    clearSeedPhrase,
    validateSeedPhrase,
    generateNewWallets,
    seedPhrase,
    loading,
    error,
    walletsCreated,
    markWalletsAsCreated: () => setWalletsCreated(true)
  };
};

// Export individual hooks for backward compatibility
export const useWalletCreationStatus = () => {
  const [walletsCreated, setWalletsCreated] = useState(false);
  
  return {
    walletsCreated,
    setWalletsCreated,
    markWalletsAsCreated: () => setWalletsCreated(true)
  };
};
