
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getBlockchainBalance } from '@/utils/blockchainConnectors';

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
 * Force refresh wallet balances and addresses from actual blockchain networks
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
        description: "Fetching latest data from networks...",
      });
      
      // For each wallet, get the latest balance from the blockchain
      const updatedWallets = await Promise.all(
        data.wallets.map(async (wallet: any) => {
          try {
            if (wallet.blockchain && wallet.address) {
              // Get balance from the actual blockchain
              const balance = await getBlockchainBalance(
                wallet.address, 
                wallet.blockchain as 'Ethereum' | 'Solana' | 'Bitcoin'
              );
              
              // Update the balance in the database
              if (typeof balance === 'number') {
                await supabase
                  .from('wallets')
                  .update({ 
                    balance: balance,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', wallet.id);
                
                // Update the wallet object
                wallet.balance = balance;
              }
            }
            return wallet;
          } catch (error) {
            console.error(`Error updating ${wallet.blockchain} wallet balance:`, error);
            return wallet;
          }
        })
      );
      
      toast({
        title: "Wallets refreshed",
        description: "Your wallet balances have been updated from the blockchain",
      });
      
      return true;
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
