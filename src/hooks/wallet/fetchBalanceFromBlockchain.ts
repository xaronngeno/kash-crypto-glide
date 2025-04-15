
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
  
  // Process all wallets to ensure consistent logs and tracking
  for (const wallet of wallets) {
    try {
      if (wallet.blockchain && wallet.address) {
        // Check cache first
        const cacheKey = `${wallet.blockchain}-${wallet.address}`;
        const now = Date.now();
        
        // We're definitely fetching from blockchain here
        console.log(`Fetching ${wallet.blockchain} balance for address ${wallet.address}`);
        const balance = await getBlockchainBalance(
          wallet.address, 
          wallet.blockchain as 'Ethereum' | 'Solana'
        );
        
        // Update the cache
        balanceCache.set(cacheKey, { balance, timestamp: now });
        console.log(`Retrieved ${wallet.blockchain} balance: ${balance}`);
        
        // Log the raw and processed balance values
        console.log(`Balance details for ${wallet.blockchain}:`, {
          rawBalance: balance,
          formattedBalance: balance.toString(),
          type: typeof balance
        });
        
        // Additional logging for non-zero balances
        if (balance > 0) {
          console.log(`Updated ${wallet.blockchain} balance: ${balance}`);
        }
      
        // Update the balance in the database
        const { error } = await supabase
          .from('wallets')
          .update({ 
            balance: balance, // Store as a number
            updated_at: new Date().toISOString()
          })
          .eq('address', wallet.address)
          .eq('user_id', userId);
          
        if (error) {
          console.error(`Error updating ${wallet.blockchain} balance in database:`, error);
          failureCount++;
        } else {
          console.log(`Successfully updated ${wallet.blockchain} balance in database: ${balance}`);
          successCount++;
        }
      }
    } catch (error) {
      console.error(`Error updating ${wallet?.blockchain} wallet:`, error);
      failureCount++;
    }
  }
  
  console.log(`Wallet refresh results - Success: ${successCount}, Failures: ${failureCount}`);
  
  if (successCount > 0) {
    toast({
      title: "Wallet balances updated",
      description: `Successfully refreshed ${successCount} wallets.`,
    });
    return true;
  } else {
    toast({
      title: "No balances updated",
      description: "Unable to refresh wallet balances at this time.",
      variant: "destructive"
    });
    return false;
  }
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
    console.log(`Direct blockchain balance request for ${blockchain} address ${address}`);
    const balance = await getBlockchainBalance(address, blockchain);
    console.log(`Retrieved ${blockchain} balance: ${balance}`);
    return balance;
  } catch (error) {
    console.error(`Error fetching ${blockchain} balance for ${address}:`, error);
    return 0;
  }
};
