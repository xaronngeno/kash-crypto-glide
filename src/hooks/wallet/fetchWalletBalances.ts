
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
    
    // Log wallet types received
    if (data?.wallets) {
      const ethWallets = data.wallets.filter(w => w.blockchain === 'Ethereum');
      const solWallets = data.wallets.filter(w => w.blockchain === 'Solana');
      
      console.log(`Received wallets - ETH: ${ethWallets.length}, SOL: ${solWallets.length}`);
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
      
      // Log wallet types being refreshed
      const ethWallets = data.wallets.filter(w => w.blockchain === 'Ethereum');
      const solWallets = data.wallets.filter(w => w.blockchain === 'Solana');
      
      console.log(`Refreshing wallets - ETH: ${ethWallets.length}, SOL: ${solWallets.length}`);
      
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
              
              // Use a local variable to determine if we need to force refresh
              const shouldForceRefresh = true; // We're always forcing refresh in this function
              
              if (cachedValue && (now - cachedValue.timestamp < CACHE_DURATION) && !shouldForceRefresh) {
                wallet.balance = cachedValue.balance;
                console.log(`Using cached balance for ${wallet.blockchain} address ${wallet.address}`);
              } else {
                // Get balance from the blockchain
                console.log(`Fetching ${wallet.blockchain} balance for address ${wallet.address}`);
                const balance = await getBlockchainBalance(
                  wallet.address, 
                  wallet.blockchain as 'Ethereum' | 'Solana'
                );
                
                // Update the cache
                if (typeof balance === 'number') {
                  balanceCache.set(cacheKey, { balance, timestamp: now });
                  console.log(`Updated ${wallet.blockchain} balance: ${balance}`);
                
                  // Update the balance in the database
                  await supabase
                    .from('wallets')
                    .update({ 
                      balance: balance,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', wallet.id);
                    
                  console.log(`Updated ${wallet.blockchain} balance: ${balance}`);
                  successCount++;
                }
              }
            }
          } catch (error) {
            console.error(`Error updating ${wallet?.blockchain} wallet:`, error);
            failureCount++;
          } finally {
            activePromises.delete(walletPromise);
            
            // Process the next wallet in the queue if any remain
            if (walletQueue.length > 0) {
              await processNextWallet();
            }
          }
        })();
        
        activePromises.add(walletPromise);
        await walletPromise;
      };
      
      // Process wallets with concurrency limit
      const initialBatch = Math.min(concurrentLimit, walletQueue.length);
      const startPromises = [];
      
      for (let i = 0; i < initialBatch; i++) {
        startPromises.push(processNextWallet());
      }
      
      // Wait for all wallets to be processed
      await Promise.all(startPromises);
      
      // Wait for any remaining active promises
      if (activePromises.size > 0) {
        await Promise.all(Array.from(activePromises));
      }
      
      console.log(`Wallet refresh results - Success: ${successCount}, Failures: ${failureCount}`);
      
      toast({
        title: "Wallet balances updated",
        description: `Successfully refreshed ${successCount} wallets.`,
      });
      
      return true;
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
