
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fetchSeedPhrase } from '@/services/seedPhraseService';
import { validateSeedPhrase } from '@/services/seedPhraseValidation';

/**
 * Hook for managing wallet seed phrase operations
 */
export const useWalletSeedPhrase = (userId: string | undefined) => {
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch the seed phrase for the current user
   */
  const fetchUserSeedPhrase = async (password: string) => {
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
      const phrase = await fetchSeedPhrase(userId, password);
      setSeedPhrase(phrase);
      return phrase;
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
   * Clear the stored seed phrase from state
   */
  const clearSeedPhrase = () => {
    setSeedPhrase(null);
  };
  
  /**
   * Validate a seed phrase against the user's wallets
   */
  const validateUserSeedPhrase = async (phrase: string) => {
    setLoading(true);
    
    try {
      const result = await validateSeedPhrase(phrase, userId);
      
      if (result.isValid) {
        toast({
          title: "Seed Phrase Valid",
          description: `The seed phrase correctly produces your ${result.matches.join(', ')} wallet address(es).`,
          variant: "default"
        });
        return true;
      } else {
        console.error("Mismatched wallets:", result.mismatches);
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
    fetchSeedPhrase: fetchUserSeedPhrase,
    clearSeedPhrase,
    validateSeedPhrase: validateUserSeedPhrase
  };
};
