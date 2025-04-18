
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { forceRefreshBlockchainBalance } from '@/utils/blockchainConnectors';

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
        // We're definitely fetching from blockchain here
        console.log(`Fetching ${wallet.blockchain} balance for address ${wallet.address}`);
        const balance = await forceRefreshBlockchainBalance(
          wallet.address, 
          wallet.blockchain as 'Ethereum' | 'Solana'
        );
        
        // Ensure balance has exactly 12 decimals precision
        const preciseBalance = parseFloat(balance.toFixed(12));
        
        // Update the cache
        const cacheKey = `${wallet.blockchain}-${wallet.address}`;
        balanceCache.set(cacheKey, { balance: preciseBalance, timestamp: Date.now() });
        
        // Log the raw and processed balance values with 12 decimals precision
        console.log(`Retrieved ${wallet.blockchain} balance: ${preciseBalance}`);
        console.log(`Balance details for ${wallet.blockchain}:`, {
          rawBalance: balance,
          formattedBalance: preciseBalance.toFixed(12),
          type: typeof preciseBalance,
          valueIsNonZero: preciseBalance > 0,
          valueAsString: preciseBalance.toFixed(12)
        });
      
        // Update the balance in the database - STORE EXACT VALUE with 12 decimal precision
        const { error } = await supabase
          .from('wallets')
          .update({ 
            balance: preciseBalance, // Store with 12 decimals precision
            updated_at: new Date().toISOString()
          })
          .eq('address', wallet.address)
          .eq('user_id', userId);
          
        if (error) {
          console.error(`Error updating ${wallet.blockchain} balance in database:`, error);
          failureCount++;
        } else {
          console.log(`Successfully updated ${wallet.blockchain} balance in database: ${preciseBalance.toFixed(12)}`);
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
      description: `Successfully refreshed ${successCount} wallets from blockchain.`,
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
    const balance = await forceRefreshBlockchainBalance(address, blockchain);
    
    // Ensure exact 12 decimal precision
    const preciseBalance = parseFloat(balance.toFixed(12));
    
    // Log with full details to trace any precision issues
    console.log(`Retrieved ${blockchain} balance details:`, {
      balance,
      exactValue: preciseBalance.toFixed(12),
      isNonZero: preciseBalance > 0,
      smallValueCheck: preciseBalance > 0 && preciseBalance < 0.001 ? 'Very small balance' : 'Normal balance'
    });
    
    return preciseBalance;
  } catch (error) {
    console.error(`Error fetching ${blockchain} balance for ${address}:`, error);
    return 0;
  }
};
