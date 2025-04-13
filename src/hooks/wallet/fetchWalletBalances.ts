
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FetchWalletsOptions {
  userId: string;
  onSuccess?: (wallets: any[]) => void;
  onError?: (error: Error) => void;
  forceRefresh?: boolean;
  retryCount?: number;
}

// Keep track of previous wallet data to provide fallback
let cachedWallets: any[] | null = null;

/**
 * Deduplicates wallets based on blockchain, currency, and wallet_type
 */
const deduplicateWallets = (wallets: any[]): any[] => {
  if (!wallets || wallets.length === 0) return [];
  
  const uniqueWalletsMap = new Map<string, any>();
  
  wallets.forEach(wallet => {
    // Create a unique key using blockchain, currency and wallet_type
    const walletKey = `${wallet.blockchain}-${wallet.currency}-${wallet.wallet_type}`;
    
    if (!uniqueWalletsMap.has(walletKey) || 
        (wallet.updated_at && uniqueWalletsMap.get(walletKey).updated_at && 
         new Date(wallet.updated_at) > new Date(uniqueWalletsMap.get(walletKey).updated_at))) {
      uniqueWalletsMap.set(walletKey, wallet);
    }
  });
  
  return Array.from(uniqueWalletsMap.values());
};

/**
 * Fetches wallet balances from the Supabase edge function
 */
export const fetchWalletBalances = async ({ 
  userId, 
  onSuccess, 
  onError,
  forceRefresh = false,
  retryCount = 0
}: FetchWalletsOptions): Promise<any[] | null> => {
  if (!userId) {
    console.log("No user ID provided for wallet fetch");
    return null;
  }

  try {
    console.log(`Fetching wallets for user: ${userId}${forceRefresh ? ' (forced refresh)' : ''}`);
    
    // Set a timeout without using AbortController since the signal isn't supported
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Wallet fetch request timed out')), 15000);
    });
    
    // Create the actual fetch promise
    const fetchPromise = supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh }
    });
    
    // Race the timeout against the actual fetch
    const { data, error } = await Promise.race([
      fetchPromise,
      timeoutPromise.then(() => {
        throw new Error('Wallet fetch request timed out');
      })
    ]);
    
    if (error) {
      // Handle function invocation error
      console.error("Edge function invocation error:", error);
      
      // If we have cached data, use it as fallback
      if (cachedWallets && cachedWallets.length > 0) {
        console.log("Using cached wallet data as fallback");
        
        // Still notify about the error
        toast({
          title: "Connection issue",
          description: "Using cached wallet data while we try to reconnect",
          variant: "default"
        });
        
        return cachedWallets;
      }
      
      // Handle server shutdown gracefully
      if (data?.retryable) {
        console.log("Server indicated request is retryable, attempting retry");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return fetchWalletBalances({ userId, onSuccess, onError, forceRefresh, retryCount });
      }
      
      // If retries are left, try again
      if (retryCount < 2) {
        console.log(`Retry attempt ${retryCount + 1}/2`);
        // Wait 1.5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchWalletBalances({ 
          userId, 
          onSuccess, 
          onError, 
          forceRefresh, 
          retryCount: retryCount + 1 
        });
      }
      
      throw new Error(`Failed to fetch wallets: ${error.message}`);
    }
    
    if (!data?.wallets) {
      console.log("No wallets found or empty wallets response");
      return [];
    }

    // Filter only native wallets (ETH, SOL, BTC)
    const nativeWallets = data.wallets.filter(wallet => 
      (wallet.blockchain === 'Ethereum' && wallet.currency === 'ETH') ||
      (wallet.blockchain === 'Solana' && wallet.currency === 'SOL') ||
      (wallet.blockchain === 'Bitcoin' && wallet.currency === 'BTC' && wallet.wallet_type === 'Native SegWit')
    );
    
    // Deduplicate the wallets
    const uniqueWallets = deduplicateWallets(nativeWallets);
    console.log(`Filtered to ${uniqueWallets.length} native wallets from ${data.wallets.length} total wallets`);
    
    // Cache the successful response for potential fallback
    cachedWallets = uniqueWallets;
    
    if (onSuccess) {
      onSuccess(uniqueWallets);
    }
    
    return uniqueWallets;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
    console.error('Error fetching wallets:', errorMessage);
    
    if (onError) {
      onError(err instanceof Error ? err : new Error(errorMessage));
    }
    
    // Return cached wallets as fallback if available
    if (cachedWallets && cachedWallets.length > 0) {
      console.log("Using cached wallet data after error");
      return cachedWallets;
    }
    
    return null;
  }
};

/**
 * Force refresh wallet balances from blockchain explorers
 */
export const refreshWalletBalances = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    toast({
      title: "Refreshing balances",
      description: "Fetching latest balances from blockchain networks...",
    });
    
    const wallets = await fetchWalletBalances({ 
      userId, 
      forceRefresh: true,
      onError: (err) => {
        toast({
          title: "Refresh failed",
          description: err.message,
          variant: "destructive"
        });
      }
    });
    
    if (wallets && wallets.length > 0) {
      toast({
        title: "Balances updated",
        description: "Your wallet balances have been refreshed",
      });
      return true;
    } else {
      toast({
        title: "No changes",
        description: "No new transactions found",
      });
      return false;
    }
  } catch (error) {
    console.error("Error refreshing wallet balances:", error);
    return false;
  }
};
