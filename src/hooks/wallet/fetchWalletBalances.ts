
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getBlockchainBalance } from '@/utils/blockchainConnectors';

// Cache for wallet balances to reduce API calls to mainnet
const balanceCache = new Map<string, { balance: number, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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
    
    return data?.wallets || [];
  } catch (err) {
    console.error("Error in fetchWalletBalances:", err);
    const error = err instanceof Error ? err : new Error("Unknown error fetching wallet balances");
    if (onError) onError(error);
    return [];
  }
};

/**
 * Force refresh wallet balances and addresses from actual blockchain mainnet networks
 * with optimized error handling and rate limiting
 */
export const refreshWalletBalances = async (userId: string): Promise<boolean> => {
  try {
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
      toast({
        title: "Checking blockchain balances",
        description: "Fetching latest data from mainnet networks...",
      });
      
      // Track successful updates
      let successCount = 0;
      let failureCount = 0;
      
      // Create a queue to process wallet balance checks
      const walletQueue = [...data.wallets];
      const concurrentLimit = 3; // Process 3 wallets at a time
      const activePromises = new Set();
      
      const processNextWallet = async () => {
        if (walletQueue.length === 0) return;
        
        const wallet = walletQueue.shift();
        
        // Create a promise for the current wallet
        const walletPromise = (async () => {
          try {
            if (wallet.blockchain && wallet.address) {
              // Check cache first
              const cacheKey = `${wallet.blockchain}-${wallet.address}`;
              const now = Date.now();
              const cachedValue = balanceCache.get(cacheKey);
              
              if (cachedValue && (now - cachedValue.timestamp < CACHE_DURATION) && !forceRefresh) {
                wallet.balance = cachedValue.balance;
                console.log(`Using cached balance for ${wallet.blockchain} address ${wallet.address}`);
              } else {
                // Get balance from the blockchain
                const balance = await getBlockchainBalance(
                  wallet.address, 
                  wallet.blockchain as 'Ethereum' | 'Solana' | 'Bitcoin'
                );
                
                // Update the cache
                if (typeof balance === 'number') {
                  balanceCache.set(cacheKey, { balance, timestamp: now });
                
                  // Update the balance in the database
                  await supabase
                    .from('wallets')
                    .update({ 
                      balance: balance,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', wallet.id);
                  
                  // Update the wallet object
                  wallet.balance = balance;
                  successCount++;
                }
              }
            }
          } catch (error) {
            console.error(`Error updating ${wallet.blockchain} wallet balance:`, error);
            failureCount++;
          } finally {
            activePromises.delete(walletPromise);
            // Process next wallet if any left
            if (walletQueue.length > 0) {
              await processNextWallet();
            }
          }
        })();
        
        // Add to active promises
        activePromises.add(walletPromise);
        
        // Start the request
        walletPromise;
      };
      
      // Start initial batch of wallet processing
      const initialBatch = Math.min(concurrentLimit, walletQueue.length);
      for (let i = 0; i < initialBatch; i++) {
        await processNextWallet();
      }
      
      // Wait for all processing to complete
      while (activePromises.size > 0) {
        await Promise.race(activePromises);
      }
      
      // Show appropriate toast based on results
      if (successCount > 0) {
        toast({
          title: `${successCount} wallets refreshed`,
          description: "Your wallet balances have been updated from the blockchain",
        });
      } else if (failureCount > 0) {
        toast({
          title: "Error refreshing wallets",
          description: `Failed to update ${failureCount} wallet balances`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "No changes needed",
          description: "Your wallet balances are already up to date",
        });
      }
      
      return successCount > 0;
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
