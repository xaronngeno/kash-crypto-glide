
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateWalletsFromSeed, generateUnifiedWallets } from '@/utils/hdWallet';
import { WalletData } from '@/utils/walletConfig';

// Flag to prevent multiple wallet creation attempts
let walletCreationInProgress = false;

// Helper function to transform DB wallet to WalletData format
const transformWallet = (wallet: { 
  id: string; 
  blockchain: string; 
  currency: string;
  address?: string;
}): WalletData => ({
  blockchain: wallet.blockchain,
  platform: wallet.blockchain,
  address: wallet.address || '', // Provide a default empty string if no address
  privateKey: undefined // We don't expose private keys on the frontend
});

// Standalone wallet creation function for use outside of React components
export const createUserWallets = async (userId: string): Promise<WalletData[] | null> => {
  if (!userId) return null;
  
  try {
    console.log("Creating wallets for user:", userId);
    
    // First check if user already has wallets to avoid duplicates
    const { data: existingWallets, error: checkError } = await supabase
      .from('wallets')
      .select('id, blockchain, address, currency')
      .eq('user_id', userId);
      
    if (checkError) {
      console.error("Error checking existing wallets:", checkError);
      throw new Error(`Failed to check existing wallets: ${checkError.message}`);
    }
    
    if (existingWallets && existingWallets.length > 0) {
      console.log(`User already has ${existingWallets.length} wallets, skipping creation`);
      // Transform DB wallets to WalletData format
      return existingWallets.map(wallet => transformWallet(wallet));
    }
    
    // Only proceed with wallet creation if no wallets exist
    const { data, error } = await supabase.functions.invoke('create-wallets', {
      method: 'POST',
      body: { userId }
    });
    
    if (error) {
      throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
    }
    
    console.log("Wallets created successfully:", data);
    // Transform the created wallets to match WalletData type
    const completeWallets = data.wallets.map(transformWallet);
    return completeWallets;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
    console.error("Error creating wallets:", errorMessage);
    return null;
  }
};

export const useWalletManager = (userId?: string) => {
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletsCreated, setWalletsCreated] = useState(false);
  const { toast } = useToast();

  /**
   * Creates wallets for a user if they don't exist
   */
  const createUserWalletsInternal = async (userId: string): Promise<WalletData[] | null> => {
    if (!userId) return null;
    
    // Prevent multiple simultaneous wallet creation attempts
    if (walletCreationInProgress) {
      console.log("Wallet creation already in progress, skipping duplicate request");
      return null;
    }
    
    try {
      walletCreationInProgress = true;
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
      // Reset the flag when done, with a small delay to prevent race conditions
      setTimeout(() => {
        walletCreationInProgress = false;
      }, 2000);
    }
  };

  /**
   * Fetches a user's seed phrase
   */
  const fetchSeedPhrase = async (password: string): Promise<string | null> => {
    if (!userId) {
      setError("User not authenticated");
      toast({
        title: "Authentication Error",
        description: "You must be logged in to view your seed phrase",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Fetching seed phrase for user:", userId);
      
      // Fetch the seed phrase through the Supabase edge function
      const { data, error } = await supabase.functions.invoke('get-seed-phrase', {
        method: 'POST',
        body: { userId, password }
      });

      if (error) {
        throw new Error(`Failed to fetch seed phrase: ${error.message}`);
      }

      if (!data?.seedPhrase) {
        throw new Error("No seed phrase found for this user");
      }

      console.log("Seed phrase retrieved successfully");
      setSeedPhrase(data.seedPhrase);
      return data.seedPhrase;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch seed phrase";
      console.error("Seed phrase error:", errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear seed phrase from memory
   */
  const clearSeedPhrase = () => {
    setSeedPhrase(null);
  };
  
  /**
   * Validate a seed phrase and test against user's wallets
   */
  const validateSeedPhrase = async (phrase: string): Promise<boolean> => {
    if (!userId) {
      setError("User not authenticated");
      return false;
    }

    try {
      setLoading(true);
      
      // Generate wallets from the provided seed phrase
      const wallets = await generateWalletsFromSeed(phrase);
      
      if (!wallets || wallets.length === 0) {
        throw new Error("Failed to generate wallets from seed phrase");
      }
      
      // Extract addresses for comparison
      const generatedAddresses = {
        ethereum: wallets.find(w => w.blockchain === 'Ethereum')?.address?.toLowerCase(),
        solana: wallets.find(w => w.blockchain === 'Solana')?.address,
        bitcoin: wallets.find(w => w.blockchain === 'Bitcoin')?.address
      };
      
      console.log("Generated addresses from seed phrase:", generatedAddresses);
      
      // Get user's actual wallets from the database
      const { data: userWallets, error } = await supabase
        .from('wallets')
        .select('blockchain, address, currency')
        .eq('user_id', userId);
        
      if (error) {
        throw new Error(`Failed to fetch user wallets: ${error.message}`);
      }
      
      console.log("User's wallet addresses:", userWallets);
      
      // Extract the user's actual addresses
      const userAddresses = {
        ethereum: userWallets?.find(w => w.blockchain === 'Ethereum' && w.currency === 'ETH')?.address?.toLowerCase(),
        solana: userWallets?.find(w => w.blockchain === 'Solana' && w.currency === 'SOL')?.address,
        bitcoin: userWallets?.find(w => w.blockchain === 'Bitcoin')?.address
      };
      
      // Compare addresses to validate
      const matches = [];
      
      if (generatedAddresses.ethereum && userAddresses.ethereum && 
          generatedAddresses.ethereum === userAddresses.ethereum) {
        matches.push('Ethereum');
      }
      
      if (generatedAddresses.solana && userAddresses.solana && 
          generatedAddresses.solana === userAddresses.solana) {
        matches.push('Solana');
      }
      
      if (generatedAddresses.bitcoin && userAddresses.bitcoin && 
          generatedAddresses.bitcoin === userAddresses.bitcoin) {
        matches.push('Bitcoin');
      }
      
      if (matches.length > 0) {
        toast({
          title: "Seed Phrase Valid",
          description: `The seed phrase correctly produces your ${matches.join(', ')} wallet address(es).`,
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "Seed Phrase Invalid",
          description: "The seed phrase does not match any of your wallet addresses.",
          variant: "destructive"
        });
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to validate seed phrase";
      console.error("Validation error:", errorMessage);
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate new wallets for testing or other purposes
   */
  const generateNewWallets = async (useExistingSeedPhrase = false): Promise<WalletData[]> => {
    try {
      setLoading(true);
      
      // Use existing seed phrase or generate new wallets
      const wallets = useExistingSeedPhrase && seedPhrase 
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
