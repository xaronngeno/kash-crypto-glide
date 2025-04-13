
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/components/AuthProvider';

/**
 * Hook for cleaning up wallet data (e.g., removing duplicates)
 */
export const useWalletCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const cleanupWalletDuplicates = async () => {
    if (!user?.id) {
      setError("User not authenticated");
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: functionError } = await supabase.functions.invoke('cleanup-wallet-duplicates', {
        method: 'POST',
        body: { userId: user.id }
      });

      if (functionError) {
        throw new Error(`Wallet cleanup error: ${functionError.message}`);
      }

      if (data.success) {
        toast({
          title: "Cleanup Successful",
          description: data.message,
          variant: "default"
        });
        return true;
      } else {
        throw new Error(data.message || "Wallet cleanup failed");
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error during wallet cleanup";
      console.error("Wallet cleanup error:", errorMessage);
      setError(errorMessage);
      toast({
        title: "Cleanup Failed",
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
    cleanupWalletDuplicates
  };
};
