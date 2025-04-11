import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/assets';
import { toast } from '@/hooks/use-toast';

interface FetchWalletsOptions {
  userId: string;
  onSuccess?: (wallets: any[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Fetches wallet balances from the Supabase edge function
 */
export const fetchWalletBalances = async ({ 
  userId, 
  onSuccess, 
  onError 
}: FetchWalletsOptions): Promise<any[] | null> => {
  if (!userId) {
    console.log("No user ID provided for wallet fetch");
    return null;
  }

  try {
    console.log("Fetching wallets for user:", userId);
    
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId }
    });
    
    if (error) {
      throw new Error(`Failed to fetch wallets: ${error.message}`);
    }
    
    if (!data?.wallets) {
      console.log("No wallets found or empty wallets response");
      return [];
    }

    const wallets = data.wallets;
    console.log(`Successfully fetched ${wallets.length} wallets`);
    
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
    
    return null;
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
export const useWalletProcessor = (prices: Record<string, { price: number; change_24h: number }>) => {
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
          name: symbol,
          symbol: symbol,
          price: assetPrice,
          amount: data.totalBalance,
          value: data.totalBalance * assetPrice,
          change: priceData?.change_24h || 0,
          icon: symbol[0],
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
