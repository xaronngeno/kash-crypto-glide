
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Fetch wallet balances and addresses
 */
export const fetchWalletBalances = async ({ 
  userId, 
  onError,
  forceRefresh = false
}: { 
  userId: string, 
  onError?: (err: Error) => void,
  forceRefresh?: boolean
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh }
    });
    
    if (error) {
      console.error("Error fetching wallet balances:", error);
      if (onError) onError(error);
      return [];
    }
    
    return data?.wallets || [];
  } catch (err) {
    console.error("Error in fetchWalletBalances:", err);
    const error = err instanceof Error ? err : new Error("Unknown error fetching wallet balances");
    if (onError) onError(error);
    return [];
  }
};

/**
 * Force refresh wallet balances and addresses
 */
export const refreshWalletBalances = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh: true }
    });
    
    if (error) {
      console.error("Error refreshing wallet balances:", error);
      toast({
        title: "Error refreshing wallets",
        description: "Failed to refresh wallet addresses",
        variant: "destructive"
      });
      return false;
    }
    
    console.log("Wallet balances refreshed successfully:", data);
    toast({
      title: "Wallets refreshed",
      description: "Your wallet addresses have been updated",
    });
    return true;
  } catch (error) {
    console.error("Error refreshing wallet balances:", error);
    toast({
      title: "Error refreshing wallets",
      description: "Failed to refresh wallet addresses",
      variant: "destructive"
    });
    return false;
  }
};
