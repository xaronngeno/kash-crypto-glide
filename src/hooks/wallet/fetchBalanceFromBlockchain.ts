
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getBlockchainBalance } from '@/utils/blockchainConnectors';

// Cache for wallet balances to reduce API calls to mainnet
const balanceCache = new Map<string, { balance: number, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

/**
 * Refresh wallet balances from the blockchain explorers
 */
export const refreshWalletBalancesFromBlockchain = async (userId: string, wallets: any[]): Promise<boolean> => {
  // Log wallet types being refreshed
  const ethWallets = wallets.filter(w => w.blockchain === 'Ethereum');
  const solWallets = wallets.filter(w => w.blockchain === 'Solana');
  
  console.log(`Refreshing wallets - ETH: ${ethWallets.length}, SOL: ${solWallets.length}`);
  console.log("Wallet addresses to refresh:", wallets.map(w => `${w.blockchain}: ${w.address}`));
  
  // Track successful updates
  let successCount = 0;
  let failureCount = 0;
  
  // Create a queue to process wallet balance checks
  const walletQueue = [...wallets];
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
              const { error } = await supabase
                .from('wallets')
                .update({ 
                  balance: balance,
                  updated_at: new Date().toISOString()
                })
                .eq('id', wallet.id);
                
              if (error) {
                console.error(`Error updating ${wallet.blockchain} balance in database:`, error);
                failureCount++;
              } else {
                console.log(`Successfully updated ${wallet.blockchain} balance in database: ${balance}`);
                successCount++;
              }
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
  
  return successCount > 0;
};

/**
 * Helper function to fetch a wallet's balance directly from the blockchain
 * This is exported for direct use by other components
 */
export const fetchBalanceFromBlockchain = async (
  address: string, 
  blockchain: 'Ethereum' | 'Solana'
): Promise<number> => {
  try {
    return await getBlockchainBalance(address, blockchain);
  } catch (error) {
    console.error(`Error fetching ${blockchain} balance for ${address}:`, error);
    return 0;
  }
};
