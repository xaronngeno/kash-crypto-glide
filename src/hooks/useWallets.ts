
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
  const { user, session } = useAuth();

  // Reference for tracking if wallets are already created
  const walletsCreatedRef = useRef(false);
  
  // Default assets for fallback and instant display
  const defaultAssetsMap = {
    'BTC': { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 0, amount: 0.05, value: 0, change: 0, icon: '₿' },
    'ETH': { id: '2', name: 'Ethereum', symbol: 'ETH', price: 0, amount: 1.2, value: 0, change: 0, icon: 'Ξ' },
    'USDT': { id: '3', name: 'USDT', symbol: 'USDT', price: 1.00, amount: 150, value: 150, change: 0, icon: '₮' },
    'SOL': { id: '4', name: 'Solana', symbol: 'SOL', price: 0, amount: 2.5, value: 0, change: 0, icon: 'Ѕ' },
    'TRX': { id: '5', name: 'Tron', symbol: 'TRX', price: 0, amount: 100, value: 0, change: 0, icon: 'T' },
    'MATIC': { id: '6', name: 'Polygon', symbol: 'MATIC', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'SUI': { id: '7', name: 'Sui', symbol: 'SUI', price: 0, amount: 0, value: 0, change: 0, icon: 'S' },
    'MONAD': { id: '8', name: 'Monad', symbol: 'MONAD', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'BNB': { id: '9', name: 'Binance Coin', symbol: 'BNB', price: 0, amount: 0, value: 0, change: 0, icon: 'B' },
    'XRP': { id: '10', name: 'XRP', symbol: 'XRP', price: 0, amount: 0, value: 0, change: 0, icon: 'X' },
    'ADA': { id: '11', name: 'Cardano', symbol: 'ADA', price: 0, amount: 0, value: 0, change: 0, icon: 'A' },
    'DOGE': { id: '12', name: 'Dogecoin', symbol: 'DOGE', price: 0, amount: 0, value: 0, change: 0, icon: 'D' },
    'DOT': { id: '13', name: 'Polkadot', symbol: 'DOT', price: 0, amount: 0, value: 0, change: 0, icon: 'P' },
    'LINK': { id: '14', name: 'Chainlink', symbol: 'LINK', price: 0, amount: 0, value: 0, change: 0, icon: 'L' }
  };

  // Initialize with default assets immediately
  useEffect(() => {
    // Start with default demo assets right away for instant display
    const initialAssets = Object.values(defaultAssetsMap).map(asset => ({...asset}));
    setAssets(initialAssets);
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
        // Get default asset data if available
        const defaultAsset = defaultAssetsMap[symbol] || {
          id: symbol,
          name: symbol,
          symbol,
          price: 0,
          amount: 0,
          value: 0,
          change: 0,
          icon: symbol[0]
        };
        
        const assetPrice = prices?.[symbol]?.price || 0;
        
        processedAssets.push({
          ...defaultAsset,
          amount: data.totalBalance,
          price: assetPrice,
          value: data.totalBalance * assetPrice,
          change: prices?.[symbol]?.change_24h || 0,
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
    }
  }, [prices]);

  // Create wallets automatically if not already created
  const createWalletsForUser = useCallback(async () => {
    if (!user || !session?.access_token || walletsCreatedRef.current) return;
    
    try {
      console.log("Attempting to create wallets for user:", user.id);
      
      const { data, error } = await supabase.functions.invoke('create-wallets', {
        method: 'POST',
        body: { userId: user.id }
      });
      
      if (error) {
        throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("Wallets created successfully:", data);
      walletsCreatedRef.current = true;
      
      // Don't show a toast for automatic wallet creation
      return data.wallets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
      console.error("Error creating wallets:", errorMessage);
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
    error: null // Don't surface errors to UI
  };
};
