
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/assets';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface UseWalletsProps {
  prices: Record<string, { price: number; change_24h: number }>;
}

export const useWallets = ({ prices }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingWallets, setCreatingWallets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  // Create wallets function
  const createWallets = async (): Promise<any> => {
    if (!user?.id || !session?.access_token || creatingWallets) {
      return Promise.resolve(null);
    }
    
    try {
      setCreatingWallets(true);
      setError(null);
      console.log("Creating wallets for user:", user.id);
      
      const { data, error: apiError } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      if (apiError) {
        throw new Error(`Wallet creation failed: ${apiError.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.message || "Unknown error creating wallets");
      }
      
      console.log("Wallets created successfully:", data);
      
      toast({
        title: 'Success',
        description: 'Your wallets have been created!',
      });
      
      // Fetch the wallet data again to refresh the list
      await fetchUserAssets();
      
      return data.wallets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
      console.error("Error creating wallets:", errorMessage);
      setError(errorMessage);
      
      toast({
        title: 'Error creating wallets',
        description: 'We could not create your wallets. Please try again later.',
        variant: 'destructive',
      });
      
      return Promise.reject(errorMessage);
    } finally {
      setCreatingWallets(false);
    }
  };

  // Process wallets into assets
  const processWallets = (wallets: any[]) => {
    try {
      console.log("Processing wallets:", wallets);
      
      // Group wallets by currency
      const currencyNetworkBalances: Record<string, { 
        totalBalance: number, 
        networks: Record<string, { address: string, balance: number }>
      }> = {};

      wallets.forEach(wallet => {
        const { currency, blockchain, address, balance: walletBalance } = wallet;
        const balance = typeof walletBalance === 'number' 
          ? walletBalance 
          : parseFloat(String(walletBalance)) || 0;
        
        if (!isNaN(balance)) {
          // Initialize currency entry if it doesn't exist
          if (!currencyNetworkBalances[currency]) {
            currencyNetworkBalances[currency] = { 
              totalBalance: 0, 
              networks: {} 
            };
          }
          
          // Add to total balance for this currency
          currencyNetworkBalances[currency].totalBalance += balance;
          
          // Add network-specific data
          currencyNetworkBalances[currency].networks[blockchain] = {
            address,
            balance
          };
        }
      });
      
      // Convert to assets array
      const processedAssets = Object.entries(currencyNetworkBalances).map(([symbol, data]) => {
        // Create asset
        const asset: Asset = {
          id: symbol,
          name: getAssetName(symbol),
          symbol,
          price: prices?.[symbol]?.price || 0,
          amount: data.totalBalance,
          value: data.totalBalance * (prices?.[symbol]?.price || 0),
          change: prices?.[symbol]?.change_24h || 0,
          icon: symbol[0].toUpperCase(),
          networks: data.networks
        };
        
        return asset;
      });
      
      // Sort by value (highest first)
      processedAssets.sort((a, b) => b.value - a.value);
      setAssets(processedAssets);
      setLoading(false);
    } catch (processError) {
      console.error("Error processing wallet data:", processError);
      setError("Failed to process wallet data");
      setLoading(false);
    }
  };
  
  // Helper function to get proper asset names
  const getAssetName = (symbol: string): string => {
    switch(symbol.toUpperCase()) {
      case 'ETH': return 'Ethereum';
      case 'SOL': return 'Solana';
      case 'TRX': return 'Tron';
      default: return symbol;
    }
  };

  // Fetch wallets
  const fetchUserAssets = useCallback(async () => {
    if (!user?.id || !session?.access_token) {
      console.log("No user or session available");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching wallets for user:", user.id);
      
      const { data, error: walletsError } = await supabase.functions.invoke('fetch-wallet-balances', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      if (walletsError) {
        throw new Error(`Error fetching wallet balances: ${walletsError.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.message || "Unknown error fetching wallets");
      }
      
      // If the response indicates we should create wallets
      if (data.shouldCreateWallets) {
        console.log("Server indicates wallets should be created");
        
        if (data.wallets && data.wallets.length > 0) {
          processWallets(data.wallets);
        } else {
          setAssets([]);
        }
        
        // Create the missing wallets
        await createWallets();
        return;
      }
      
      if (!data.wallets || data.wallets.length === 0) {
        console.log("No wallets found for user");
        setAssets([]);
        setLoading(false);
        return;
      }
      
      // Process the wallets into assets
      processWallets(data.wallets);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
      console.error('Error fetching wallets:', errorMessage);
      setError("Error fetching wallet data: " + errorMessage);
      
      toast({
        title: 'Error loading wallets',
        description: 'Could not load your wallet data. Please try again later.',
        variant: 'destructive',
      });
      
      setLoading(false);
    }
  }, [user?.id, session?.access_token]);

  // Update assets when prices change
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0 && assets.length > 0) {
      setAssets(prevAssets => 
        prevAssets.map(asset => {
          const priceData = prices[asset.symbol];
          if (priceData) {
            return {
              ...asset,
              price: priceData.price,
              change: priceData.change_24h,
              value: asset.amount * priceData.price
            };
          }
          return asset;
        })
      );
    }
  }, [prices]);

  // Initial fetching
  useEffect(() => {
    fetchUserAssets();
  }, [fetchUserAssets]);

  // Safety timeout
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.log("Safety timeout reached - forcing loading state to complete");
        setLoading(false);
      }
    }, 10000); // 10 second maximum timeout
    
    return () => clearTimeout(safetyTimer);
  }, [loading]);

  return { 
    assets, 
    loading, 
    isCreatingWallets: creatingWallets,
    error,
    createWallets,
    refreshWallets: fetchUserAssets
  };
};
