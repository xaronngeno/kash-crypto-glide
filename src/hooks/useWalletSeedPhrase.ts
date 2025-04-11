
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateWalletsFromSeed } from '@/utils/walletGenerators';
import { isSolanaAddress } from '@/utils/addressValidator';

export const useWalletSeedPhrase = (userId: string | undefined) => {
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSeedPhrase = async (password: string) => {
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

  const clearSeedPhrase = () => {
    setSeedPhrase(null);
  };
  
  // New function to validate a seed phrase and test against user's wallets
  const validateSeedPhrase = async (phrase: string) => {
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
      
      console.log("Generated addresses:", generatedAddresses);
      
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
      
      // Compare at least one address to validate
      const matches = [];
      
      if (generatedAddresses.ethereum && userAddresses.ethereum && 
          generatedAddresses.ethereum === userAddresses.ethereum) {
        matches.push('Ethereum');
      }
      
      if (generatedAddresses.solana && userAddresses.solana) {
        // For Solana, confirm both addresses are valid Solana addresses
        const bothValidSolanaAddresses = isSolanaAddress(generatedAddresses.solana) && 
                                          isSolanaAddress(userAddresses.solana);
                                        
        if (bothValidSolanaAddresses && generatedAddresses.solana === userAddresses.solana) {
          matches.push('Solana');
        } else {
          console.log("Solana addresses don't match or are invalid:");
          console.log("- Generated:", generatedAddresses.solana, "Valid:", isSolanaAddress(generatedAddresses.solana));
          console.log("- User's:", userAddresses.solana, "Valid:", isSolanaAddress(userAddresses.solana));
        }
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

  return {
    seedPhrase,
    loading,
    error,
    fetchSeedPhrase,
    clearSeedPhrase,
    validateSeedPhrase
  };
};
