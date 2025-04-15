
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { refreshWalletBalancesFromBlockchain } from '@/hooks/wallet/fetchBalanceFromBlockchain';

/**
 * Fetch wallet balances and addresses with caching
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
    // Log that we're fetching wallet balances for debugging
    console.log(`Fetching wallet balances for user ${userId}, force refresh: ${forceRefresh}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh }
    });
    
    if (error) {
      console.error("Error fetching wallet balances:", error);
      if (onError) onError(error);
      return [];
    }
    
    if (!data?.wallets || data.wallets.length === 0) {
      console.log("No wallets returned from the API");
      return [];
    }
    
    // Ensure we have numeric balance values (fix potential string values)
    const processedWallets = data.wallets.map(wallet => ({
      ...wallet,
      balance: typeof wallet.balance === 'string' 
        ? parseFloat(wallet.balance) || 0
        : (typeof wallet.balance === 'number' ? wallet.balance : 0)
    }));
    
    // Log wallet types received
    const ethWallets = processedWallets.filter(w => w.blockchain === 'Ethereum');
    const solWallets = processedWallets.filter(w => w.blockchain === 'Solana');
    
    console.log(`Received wallets - ETH: ${ethWallets.length}, SOL: ${solWallets.length}`);
    console.log("Processed wallet data:", processedWallets);
    
    return processedWallets;
  } catch (err) {
    console.error("Error in fetchWalletBalances:", err);
    const error = err instanceof Error ? err : new Error("Unknown error fetching wallet balances");
    if (onError) onError(error);
    return [];
  }
};

/**
 * Re-export the createUserWallets function for easier access
 */
export { createUserWallets } from './createUserWallets';

/**
 * Force refresh wallet balances and addresses from actual blockchain mainnet networks
 * with optimized error handling and rate limiting
 */
export const refreshWalletBalances = async (userId: string): Promise<boolean> => {
  try {
    toast({
      title: "Refreshing wallet balances",
      description: "Fetching latest data from blockchain...",
    });
    
    // First get the wallets from the database
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
    
    // If we have wallets, update their balances from the blockchain
    if (data?.wallets && data.wallets.length > 0) {
      console.log("Got wallets for blockchain update:", data.wallets);
      
      const refreshResult = await refreshWalletBalancesFromBlockchain(userId, data.wallets);
      
      if (refreshResult) {
        toast({
          title: "Balance update successful",
          description: "Your wallet balances have been updated from blockchain data",
        });
      }
      
      return refreshResult;
    } else {
      toast({
        title: "No wallets found",
        description: "No wallets available to refresh",
        variant: "destructive"
      });
      return false;
    }
  } catch (error) {
    console.error("Error refreshing wallet balances:", error);
    toast({
      title: "Error refreshing wallets",
      description: "Failed to refresh wallet balances",
      variant: "destructive"
    });
    return false;
  }
};
