
import { toast } from '@/hooks/use-toast';
import { fetchWalletBalances } from './fetchWalletBalances';

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
    toast({
      title: "Error",
      description: "Failed to refresh wallet balances. Please try again later.",
      variant: "destructive"
    });
    return false;
  }
};
