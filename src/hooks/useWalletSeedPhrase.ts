
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWalletSeedPhrase = (userId: string | undefined) => {
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSeedPhrase = async (password: string) => {
    if (!userId) {
      setError("User not authenticated");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
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

      setSeedPhrase(data.seedPhrase);
      return data.seedPhrase;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch seed phrase";
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

  return {
    seedPhrase,
    loading,
    error,
    fetchSeedPhrase
  };
};
