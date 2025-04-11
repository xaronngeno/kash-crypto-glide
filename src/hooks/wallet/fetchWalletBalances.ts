
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FetchWalletsOptions {
  userId: string;
  onSuccess?: (wallets: any[]) => void;
  onError?: (error: Error) => void;
  forceRefresh?: boolean;
}

/**
 * Fetches wallet balances from the Supabase edge function
 */
export const fetchWalletBalances = async ({ 
  userId, 
  onSuccess, 
  onError,
  forceRefresh = false
}: FetchWalletsOptions): Promise<any[] | null> => {
  if (!userId) {
    console.log("No user ID provided for wallet fetch");
    return null;
  }

  try {
    console.log(`Fetching wallets for user: ${userId}${forceRefresh ? ' (forced refresh)' : ''}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh }
    });
    
    if (error) {
      throw new Error(`Failed to fetch wallets: ${error.message}`);
    }
    
    if (!data?.wallets) {
      console.log("No wallets found or empty wallets response");
      return [];
    }

    const wallets = data.wallets;
    console.log(`Successfully fetched ${wallets.length} wallets`);
    
    if (onSuccess) {
      onSuccess(wallets);
    }
    
    return wallets;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
    console.error('Error fetching wallets:', errorMessage);
    
    if (onError) {
      onError(err instanceof Error ? err : new Error(errorMessage));
    }
    
    return null;
  }
};
