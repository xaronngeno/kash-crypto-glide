
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { refreshWalletBalances } from '@/hooks/wallet';
import { WalletAddress, WalletResponse } from '@/types/wallet';
import { getCurrencyLogo } from '@/utils/currencyUtils';

interface UseWalletManagementProps {
  userId: string | undefined;
  skipInitialLoad?: boolean;
}

interface UseWalletManagementReturn {
  walletAddresses: WalletAddress[];
  loading: boolean;
  creatingWallets: boolean;
  noWalletsFound: boolean;
  createWallets: () => Promise<void>;
  handleTryAgain: () => Promise<void>;
  refreshWalletBalancesOnly: (userId: string) => Promise<void>;
}

// Caching for wallet addresses to optimize performance
const cachedWallets: {
  addresses: WalletAddress[];
  timestamp: number;
  userId: string | null;
} = {
  addresses: [],
  timestamp: 0,
  userId: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

export const useWalletManagement = ({ 
  userId, 
  skipInitialLoad = false 
}: UseWalletManagementProps): UseWalletManagementReturn => {
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
        
        // Update the cache
        updateWalletCache(addresses, userId);
        
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

  // Helper function to update the wallet cache
  const updateWalletCache = (addresses: WalletAddress[], userId: string) => {
    cachedWallets.addresses = addresses;
    cachedWallets.timestamp = Date.now();
    cachedWallets.userId = userId;
  };
  
  // Function to refresh only wallet balances without fetching addresses again
  const refreshWalletBalancesOnly = async (userId: string) => {
    try {
      await refreshWalletBalances(userId);
      toast({
        title: "Balance updated",
        description: "Your wallet balances have been refreshed",
      });
    } catch (error) {
      console.error("Error refreshing wallet balances:", error);
      toast({
        title: "Balance update failed",
        description: "Could not refresh wallet balances at this time",
        variant: "destructive"
      });
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
        updateWalletCache(addresses, userId);
        
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
    
    // Check if we have valid cached data for this user
    const now = Date.now();
    const cacheIsValid = 
      cachedWallets.userId === userId && 
      cachedWallets.addresses.length > 0 && 
      (now - cachedWallets.timestamp < CACHE_DURATION);
    
    // Use cached data if available and skipInitialLoad is true
    if (skipInitialLoad && cacheIsValid) {
      console.log("Using cached wallet addresses");
      setWalletAddresses(cachedWallets.addresses);
      setNoWalletsFound(cachedWallets.addresses.length === 0);
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
        
        // Update the cache
        updateWalletCache(addresses, userId);
        
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
  }, [userId, toast, skipInitialLoad]);

  useEffect(() => {
    fetchWalletAddresses();
  }, [fetchWalletAddresses]);

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
