
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { generateWalletsFromSeed } from '@/utils/walletGenerators';

/**
 * Hook for validating seed phrases
 */
export const useWalletValidator = (userId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const validateSeedPhrase = async (phrase: string): Promise<boolean> => {
    if (!userId) {
      setError("User not authenticated");
      return false;
    }
    
    try {
      setLoading(true);
      setError(null);
      
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
      
      // Get user's actual wallets from the database
      const { data: userWallets, error } = await supabase
        .from('wallets')
        .select('blockchain, address, currency')
        .eq('user_id', userId);
        
      if (error) {
        throw new Error(`Failed to fetch user wallets: ${error.message}`);
      }
      
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
      setError(errorMessage);
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
  
  return {
    loading,
    error,
    validateSeedPhrase
  };
};
