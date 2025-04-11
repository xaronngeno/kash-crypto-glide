
// Re-export all wallet-related hooks and functions from the wallet directory
export * from './wallet';

// Add function to refresh wallet balances
export const refreshWalletBalances = async (userId: string): Promise<any> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh: true }
    });
    
    if (error) {
      throw new Error(`Error refreshing wallet balances: ${error.message}`);
    }
    
    return data.wallets || [];
  } catch (err) {
    console.error('Error refreshing wallet balances:', err);
    throw err;
  }
};
