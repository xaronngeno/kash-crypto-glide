
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { refreshWalletBalances } from '@/hooks/wallet';
import { WalletAddress, WalletResponse } from '@/types/wallet';
import { getCurrencyLogo } from '@/utils/currencyUtils';

interface UseWalletManagementProps {
  userId: string | undefined;
}

interface UseWalletManagementReturn {
  walletAddresses: WalletAddress[];
  loading: boolean;
  creatingWallets: boolean;
  noWalletsFound: boolean;
  createWallets: () => Promise<void>;
  handleTryAgain: () => Promise<void>;
}

export const useWalletManagement = ({ userId }: UseWalletManagementProps): UseWalletManagementReturn => {
  const { toast } = useToast();
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [noWalletsFound, setNoWalletsFound] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);

  const createWallets = async () => {
    if (!userId || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      console.log("Creating wallets for user:", userId);
      
      const { data, error } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId }
      });
      
      if (error) {
        throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("Wallets created successfully:", data);
      
      const { data: wallets, error: fetchError } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId }
      });
      
      if (fetchError) {
        throw fetchError;
      }
      
      if (wallets && wallets.success && wallets.wallets && wallets.wallets.length > 0) {
        const filteredWallets = wallets.wallets.filter(
          (w: WalletResponse) => w.blockchain !== 'Bitcoin' && w.currency !== 'BTC'
        );
        
        const addresses: WalletAddress[] = filteredWallets.map((wallet: WalletResponse) => ({
          blockchain: wallet.blockchain,
          symbol: wallet.currency,
          address: wallet.address,
          logo: getCurrencyLogo(wallet.currency)
        }));
        
        setWalletAddresses(addresses);
        setNoWalletsFound(false);
        
        toast({
          title: "Wallets created",
          description: "Your wallets have been created successfully.",
        });
      } else {
        setNoWalletsFound(true);
        throw new Error("No wallets were created");
      }
    } catch (error) {
      console.error("Error creating wallets:", error);
      toast({
        title: "Error creating wallets",
        description: "Failed to create wallets. Please try again later.",
        variant: "destructive"
      });
      setNoWalletsFound(true);
    } finally {
      setCreatingWallets(false);
    }
  };

  const handleTryAgain = async () => {
    if (!userId) return;
    
    setLoading(true);
    
    try {
      toast({
        title: "Refreshing wallets",
        description: "Attempting to regenerate wallet addresses...",
      });
      
      await refreshWalletBalances(userId);
      
      const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId, forceRefresh: true }
      });
      
      if (error) {
        throw error;
      }
      
      if (data && data.success && data.wallets && data.wallets.length > 0) {
        const filteredWallets = data.wallets.filter(
          (w: WalletResponse) => w.blockchain !== 'Bitcoin' && w.currency !== 'BTC'
        );
        
        console.log("Refreshed wallet addresses:", filteredWallets);
        
        const addresses: WalletAddress[] = filteredWallets.map((wallet: WalletResponse) => ({
          blockchain: wallet.blockchain,
          symbol: wallet.currency,
          address: wallet.address,
          logo: getCurrencyLogo(wallet.currency)
        }));
        
        setWalletAddresses(addresses);
        
        toast({
          title: "Wallets refreshed",
          description: "Your wallet addresses have been updated.",
        });
      } else {
        throw new Error("No wallets found after refresh");
      }
    } catch (error) {
      console.error("Error refreshing wallets:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh wallet addresses. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletAddresses = useCallback(async () => {
    if (!userId) {
      console.error("User not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching wallet addresses for user:", userId);
      
      const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId }
      });
      
      if (error) {
        throw error;
      }

      if (data && data.success && data.wallets && data.wallets.length > 0) {
        const filteredWallets = data.wallets.filter(
          (w: WalletResponse) => w.blockchain !== 'Bitcoin' && w.currency !== 'BTC'
        );
        
        console.log("Fetched wallet addresses:", filteredWallets);
        
        const addresses: WalletAddress[] = filteredWallets.map((wallet: WalletResponse) => ({
          blockchain: wallet.blockchain,
          symbol: wallet.currency,
          address: wallet.address,
          logo: getCurrencyLogo(wallet.currency)
        }));
        
        setWalletAddresses(addresses);
        setNoWalletsFound(addresses.length === 0);
        
        if (addresses.length === 0) {
          console.log("No supported wallets found for user, attempting to create wallets");
          await createWallets();
        }
      } else {
        console.log("No wallets found for user, attempting to create wallets");
        await createWallets();
      }
    } catch (error) {
      console.error("Error fetching wallet addresses:", error);
      toast({
        title: "Error fetching wallets",
        description: "There was a problem loading your wallets. Please try again later.",
        variant: "destructive"
      });
      setNoWalletsFound(true);
      setWalletAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchWalletAddresses();
  }, [fetchWalletAddresses]);

  return {
    walletAddresses,
    loading,
    creatingWallets,
    noWalletsFound,
    createWallets,
    handleTryAgain
  };
};
