// Re-export all wallet-related hooks and functions from the wallet directory
export * from './wallet';

// Add function to refresh wallet balances
export const refreshWalletBalances = async (userId: string): Promise<any> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Show loading toast
    const { toast } = await import('@/hooks/use-toast');
    toast({
      title: "Refreshing balances",
      description: "Fetching latest wallet data...",
    });
    
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh: true }
    });
    
    if (error) {
      toast({
        title: "Error refreshing balances",
        description: error.message,
        variant: "destructive"
      });
      throw new Error(`Error refreshing wallet balances: ${error.message}`);
    }
    
    toast({
      title: "Balances updated",
      description: "Your wallet information has been refreshed",
    });
    
    return data.wallets || [];
  } catch (err) {
    console.error('Error refreshing wallet balances:', err);
    throw err;
  }
};
