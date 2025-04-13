
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * Hook to clean up duplicate wallets in the database
 */
export const useWalletCleanup = () => {
  /**
   * Clean up duplicate wallets for a user
   */
  const cleanupDuplicateWallets = async (userId: string) => {
    if (!userId) {
      console.error('No user ID provided for wallet cleanup');
      return { success: false };
    }
    
    try {
      // Show loading toast
      toast({
        title: "Cleaning up wallets",
        description: "Processing wallet data...",
      });
      
      const { data, error } = await supabase.functions.invoke('cleanup-wallet-duplicates', {
        method: 'POST',
        body: { userId }
      });
      
      if (error) {
        console.error('Error cleaning up wallets:', error);
        toast({
          title: "Error cleaning up wallets",
          description: error.message,
          variant: "destructive"
        });
        return { success: false, error };
      }
      
      if (data.duplicatesRemoved > 0) {
        toast({
          title: "Cleanup complete",
          description: `Removed ${data.duplicatesRemoved} duplicate wallets.`,
        });
      } else {
        toast({
          title: "No duplicates found",
          description: "Your wallet data is already clean.",
        });
      }
      
      return { 
        success: true, 
        walletsFound: data.walletsFound,
        duplicatesRemoved: data.duplicatesRemoved,
        walletsRemaining: data.walletsRemaining
      };
    } catch (err) {
      console.error('Error in wallet cleanup:', err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      
      toast({
        title: "Error cleaning up wallets",
        description: "Please try again later",
        variant: "destructive"
      });
      
      return { success: false, error: errorMessage };
    }
  };
  
  return { cleanupDuplicateWallets };
};
