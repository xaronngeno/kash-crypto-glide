
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WalletAddress } from '@/types/wallet';
import { toast } from '@/hooks/use-toast';
import { refreshWalletBalances } from '@/hooks/wallet';

interface UseWalletManagementProps {
  userId?: string | null;
  skipInitialLoad?: boolean;
}

export const useWalletManagement = ({ userId, skipInitialLoad = false }: UseWalletManagementProps) => {
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(!skipInitialLoad);
  const [creatingWallets, setCreatingWallets] = useState(false);
  const [noWalletsFound, setNoWalletsFound] = useState(false);
  
  const fetchWalletAddresses = useCallback(async () => {
    if (!userId) {
      console.log("No user ID available");
      return;
    }
    
    try {
      console.log(`Fetching wallet addresses for user: ${userId}`);
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId, forceRefresh: true }
      });
      
      if (error) {
        console.error("Error fetching wallet addresses:", error);
        setNoWalletsFound(true);
        return;
      }
      
      if (!data?.wallets || data.wallets.length === 0) {
        console.log("No wallets found");
        setNoWalletsFound(true);
        return;
      }
      
      // Process and filter valid wallets
      const processedWallets: WalletAddress[] = data.wallets
        .filter(wallet => wallet.address && wallet.address.trim() !== '')
        .map(wallet => ({
          blockchain: wallet.blockchain,
          symbol: wallet.currency,
          address: wallet.address,
          logo: wallet.blockchain === 'Ethereum' ? 
            'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' :
            wallet.blockchain === 'Solana' ? 
              'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png' :
              '/placeholder.svg',
          balance: typeof wallet.balance === 'number' ? 
            parseFloat(wallet.balance.toFixed(12)) : 
            parseFloat(parseFloat(wallet.balance || '0').toFixed(12))
        }));
      
      console.log("Fetched wallet addresses:", processedWallets);
      
      // Log any empty addresses
      const emptyAddresses = data.wallets.filter(w => !w.address || w.address.trim() === '');
      if (emptyAddresses.length > 0) {
        console.warn("Found wallets with empty addresses:", emptyAddresses);
      }
      
      setWalletAddresses(processedWallets);
      setNoWalletsFound(processedWallets.length === 0);
    } catch (error) {
      console.error("Error loading wallet addresses:", error);
      setNoWalletsFound(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  const createWallets = async () => {
    if (!userId) return;
    
    setCreatingWallets(true);
    try {
      console.log(`Creating wallets for user: ${userId}`);
      const { data, error } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId }
      });
      
      if (error) {
        console.error("Error from create-wallets function:", error);
        throw new Error(`Failed to create wallets: ${error.message}`);
      }
      
      console.log("Create wallets response:", data);
      await fetchWalletAddresses();
      toast({
        title: "Wallets created",
        description: "Your crypto wallets have been created successfully.",
      });
    } catch (error) {
      console.error("Error creating wallets:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create wallets. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreatingWallets(false);
    }
  };
  
  const handleTryAgain = () => {
    fetchWalletAddresses();
  };
  
  const refreshWalletBalancesOnly = async (userId: string): Promise<boolean> => {
    try {
      console.log(`Refreshing wallet balances for user: ${userId}`);
      toast({
        title: "Refreshing balance",
        description: "Fetching latest blockchain data...",
      });
      
      const success = await refreshWalletBalances(userId);
      
      if (success) {
        // Refresh wallet addresses after balance update
        await fetchWalletAddresses();
        toast({
          title: "Balance updated",
          description: "Your wallet balances have been updated.",
        });
      } else {
        toast({
          title: "Update incomplete",
          description: "Could not fully update balances.",
          variant: "destructive"
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error refreshing balances:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to update wallet balances.",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Always fetch wallet addresses on component mount
  useEffect(() => {
    if (userId) {
      fetchWalletAddresses();
    }
  }, [userId, fetchWalletAddresses]);
  
  return {
    walletAddresses,
    loading,
    creatingWallets,
    noWalletsFound,
    createWallets,
    handleTryAgain,
    refreshWalletBalancesOnly
  };
};
