import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Asset } from '@/types/assets';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/hooks/use-toast';

interface UseWalletsProps {
  prices: Record<string, { price: number; change_24h: number }>;
}

export const useWallets = ({ prices }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user, session } = useAuth();

  // Reference for tracking if wallets are already created
  const walletsCreatedRef = useRef(false);
  
  // Initialize with an empty array
  useEffect(() => {
    setAssets([]);
  }, []);

  // Update asset prices when prices change
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0) {
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

  // Process wallets function
  const processWallets = useCallback((wallets: any[]) => {
    try {
      console.log("Processing wallets in background:", wallets);
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
      
      // Convert to assets array and preserve existing data
      const processedAssets: Asset[] = [];
      
      Object.entries(currencyNetworkBalances).forEach(([symbol, data]) => {
        const assetPrice = prices?.[symbol]?.price || 0;
        
        processedAssets.push({
          id: symbol,
          name: symbol,
          symbol: symbol,
          price: assetPrice,
          amount: data.totalBalance,
          value: data.totalBalance * assetPrice,
          change: prices?.[symbol]?.change_24h || 0,
          icon: symbol[0],
          networks: data.networks || {}
        });
      });
      
      // Sort by value (highest first)
      processedAssets.sort((a, b) => b.value - a.value);
      
      // Only update if we have real data
      if (processedAssets.length > 0) {
        setAssets(processedAssets);
      }
    } catch (processError) {
      console.error("Error processing wallet data:", processError);
      setError("Error processing wallet data");
    }
  }, [prices]);

  // Create wallets automatically if not already created
  const createWalletsForUser = useCallback(async () => {
    if (!user || !session?.access_token || walletsCreatedRef.current) return;
    
    try {
      console.log("Attempting to create wallets for user:", user.id);
      
      const { data, error: walletError } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      if (walletError) {
        throw new Error(`Wallet creation failed: ${walletError.message || "Unknown error"}`);
      }
      
      console.log("Wallets created successfully:", data);
      walletsCreatedRef.current = true;
      
      // Don't show a toast for automatic wallet creation
      return data.wallets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
      console.error("Error creating wallets:", errorMessage);
      setError(errorMessage);
      return null;
    }
  }, [user, session?.access_token]);

  // Fetch user assets in the background with near-zero delay
  useEffect(() => {
    // Avoids tiny delays in data fetching
    setTimeout(() => {
      const fetchUserAssets = async () => {
        if (!user || !session?.access_token) {
          console.log("No user or session available");
          return;
        }
        
        setError(null);
        
        try {
          console.log("Fetching wallets for user in background:", user.id);
          
          // Get real wallet balances without setting loading state
          const { data: wallets, error: walletsError } = await supabase.functions.invoke('fetch-wallet-balances', {
            method: 'POST',
            body: { userId: user.id }
          });
              
          if (walletsError) {
            throw walletsError;
          }
          
          // Process wallets if available
          if (wallets && wallets.success && wallets.wallets) {
            console.log("Successfully fetched wallet balances:", wallets);
            processWallets(wallets.wallets);
          } else {
            // Fallback to DB wallets if edge function fails
            const { data: dbWallets, error: dbWalletsError } = await supabase
              .from('wallets')
              .select('*')
              .eq('user_id', user.id);
              
            if (dbWalletsError) {
              throw dbWalletsError;
            }
            
            if (!dbWallets || dbWallets.length === 0) {
              console.log("No wallets found for user");
              
              // Auto-create wallets if none exist
              if (!walletsCreatedRef.current) {
                await createWalletsForUser();
              }
              return;
            }
            
            console.log(`Found ${dbWallets.length} wallets for user:`, user.id);
            processWallets(dbWallets);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
          console.error('Error fetching wallets:', errorMessage);
          setError(errorMessage);
        }
      };
  
      // Execute fetch immediately in background with minimal delay
      fetchUserAssets();
      
      // Set up periodic refresh in the background
      const refreshInterval = setInterval(fetchUserAssets, 60000); // Every 60 seconds
      
      return () => clearInterval(refreshInterval);
    }, 1); // 1ms delay - practically instant but allows React to render first
  }, [user, session, processWallets, createWalletsForUser]);

  return { 
    assets, 
    loading: false, // Always return false to never show loading state
    error // Now exposing error state
  };
};
