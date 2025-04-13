
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateWalletsFromSeed } from '@/utils/hdWallet';

/**
 * Hook for managing seed phrase operations
 */
export const useSeedPhrase = (userId?: string) => {
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
  
  return {
    seedPhrase,
    loading,
    error,
    fetchSeedPhrase,
    clearSeedPhrase,
  };
};
