import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/assets';
import { toast } from '@/hooks/use-toast';

interface FetchWalletsOptions {
  userId: string;
  onSuccess?: (wallets: any[]) => void;
  onError?: (error: Error) => void;
  forceRefresh?: boolean;
  retryCount?: number;
}

// Keep track of previous wallet data to provide fallback
let cachedWallets: any[] | null = null;

/**
 * Fetches wallet balances from the Supabase edge function
 */
export const fetchWalletBalances = async ({ 
  userId, 
  onSuccess, 
  onError,
  forceRefresh = false,
  retryCount = 0
}: FetchWalletsOptions): Promise<any[] | null> => {
  if (!userId) {
    console.log("No user ID provided for wallet fetch");
    return null;
  }

  try {
    console.log(`Fetching wallets for user: ${userId}${forceRefresh ? ' (forced refresh)' : ''}`);
    
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh }
    });
    
    if (error) {
      // Handle function invocation error
      console.error("Edge function invocation error:", error);
      
      // If we have cached data, use it as fallback
      if (cachedWallets && cachedWallets.length > 0) {
        console.log("Using cached wallet data as fallback");
        
        // Still notify about the error
        toast({
          title: "Connection issue",
          description: "Using cached wallet data while we try to reconnect",
          variant: "default"
        });
        
        return cachedWallets;
      }
      
      // If retries are left, try again
      if (retryCount < 2) {
        console.log(`Retry attempt ${retryCount + 1}/2`);
        // Wait 1.5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchWalletBalances({ 
          userId, 
          onSuccess, 
          onError, 
          forceRefresh, 
          retryCount: retryCount + 1 
        });
      }
      
      throw new Error(`Failed to fetch wallets: ${error.message}`);
    }
    
    if (!data?.wallets) {
      console.log("No wallets found or empty wallets response");
      return [];
    }

    const wallets = data.wallets;
    console.log(`Successfully fetched ${wallets.length} wallets`);
    
    // Cache the successful response for potential fallback
    cachedWallets = wallets;
    
    if (onSuccess) {
      onSuccess(wallets);
    }
    
    return wallets;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
    console.error('Error fetching wallets:', errorMessage);
    
    if (onError) {
      onError(err instanceof Error ? err : new Error(errorMessage));
    }
    
    // Return cached wallets as fallback if available
    if (cachedWallets && cachedWallets.length > 0) {
      console.log("Using cached wallet data after error");
      return cachedWallets;
    }
    
    return null;
  }
};

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
    return false;
  }
};

/**
 * Creates wallets for a user if they don't exist
 */
export const createUserWallets = async (userId: string): Promise<any[] | null> => {
  if (!userId) return null;
  
  try {
    console.log("Creating wallets for user:", userId);
    
    const { data, error } = await supabase.functions.invoke('create-wallets', {
      method: 'POST',
      body: { userId }
    });
    
    if (error) {
      throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
    }
    
    console.log("Wallets created successfully:", data);
    return data.wallets || [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
    console.error("Error creating wallets:", errorMessage);
    return null;
  }
};

/**
 * Hook for tracking if wallets have been created
 */
export const useWalletCreationStatus = () => {
  const [walletsCreated, setWalletsCreated] = useState(false);
  
  return {
    walletsCreated,
    setWalletsCreated,
    markWalletsAsCreated: () => setWalletsCreated(true)
  };
};

/**
 * Hook for processing wallet data into assets
 */
export const useWalletProcessor = (prices: Record<string, { price: number; change_24h: number; logo?: string; name?: string }>) => {
  const processWallets = useCallback((wallets: any[]): Asset[] => {
    try {
      console.log("Processing wallets:", wallets.length);
      
      // Group wallets by currency, keeping track of network
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
      const assets: Asset[] = [];
      
      Object.entries(currencyNetworkBalances).forEach(([symbol, data]) => {
        const priceData = prices?.[symbol];
        const assetPrice = priceData?.price || 0;
        
        assets.push({
          id: symbol,
          name: priceData?.name || symbol,
          symbol: symbol,
          price: assetPrice,
          amount: data.totalBalance,
          value: data.totalBalance * assetPrice,
          change: priceData?.change_24h || 0,
          icon: symbol[0],
          logo: priceData?.logo || undefined,
          networks: data.networks || {}
        });
      });
      
      // Sort by value (highest first)
      return assets.sort((a, b) => b.value - a.value);
    } catch (error) {
      console.error("Error processing wallet data:", error);
      return [];
    }
  }, [prices]);

  return { processWallets };
};
