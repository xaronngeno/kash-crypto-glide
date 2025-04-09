
import { useState, useEffect } from 'react';
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
  const [walletsCreated, setWalletsCreated] = useState(false);
  const [creatingWallets, setCreatingWallets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session, profile } = useAuth();
  
  const defaultAssetsMap = {
    'BTC': { id: '1', name: 'Bitcoin', symbol: 'BTC', price: 0, amount: 0, value: 0, change: 0, icon: '₿' },
    'ETH': { id: '2', name: 'Ethereum', symbol: 'ETH', price: 0, amount: 0, value: 0, change: 0, icon: 'Ξ' },
    'USDT': { id: '3', name: 'USDT', symbol: 'USDT', price: 1.00, amount: 0, value: 0, change: 0, icon: '₮' },
    'SOL': { id: '4', name: 'Solana', symbol: 'SOL', price: 0, amount: 0, value: 0, change: 0, icon: 'Ѕ' },
    'MATIC': { id: '5', name: 'Polygon', symbol: 'MATIC', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'SUI': { id: '6', name: 'Sui', symbol: 'SUI', price: 0, amount: 0, value: 0, change: 0, icon: 'S' },
    'MONAD': { id: '7', name: 'Monad', symbol: 'MONAD', price: 0, amount: 0, value: 0, change: 0, icon: 'M' },
    'BNB': { id: '8', name: 'Binance Coin', symbol: 'BNB', price: 0, amount: 0, value: 0, change: 0, icon: 'B' },
    'XRP': { id: '9', name: 'XRP', symbol: 'XRP', price: 0, amount: 0, value: 0, change: 0, icon: 'X' },
    'ADA': { id: '10', name: 'Cardano', symbol: 'ADA', price: 0, amount: 0, value: 0, change: 0, icon: 'A' },
    'DOGE': { id: '11', name: 'Dogecoin', symbol: 'DOGE', price: 0, amount: 0, value: 0, change: 0, icon: 'D' },
    'DOT': { id: '12', name: 'Polkadot', symbol: 'DOT', price: 0, amount: 0, value: 0, change: 0, icon: 'P' },
    'LINK': { id: '13', name: 'Chainlink', symbol: 'LINK', price: 0, amount: 0, value: 0, change: 0, icon: 'L' }
  };

  const createWalletsForUser = async () => {
    if (!user || !session?.access_token || creatingWallets) return;
    
    try {
      setCreatingWallets(true);
      console.log("Attempting to create wallets for user:", user.id);
      
      // Set a timeout for wallet creation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Wallet creation timed out after 8 seconds")), 8000);
      });
      
      // Create wallets request
      const walletPromise = supabase.functions.invoke('create-wallets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: { userId: user.id }
      });
      
      // Race between wallet creation and timeout
      const result = await Promise.race([walletPromise, timeoutPromise]);
      
      // @ts-ignore - TypeScript doesn't know the shape of result
      const { data, error } = result;
      
      if (error) {
        throw new Error(`Wallet creation failed: ${error.message || "Unknown error"}`);
      }
      
      console.log("Wallets created successfully:", data);
      setWalletsCreated(true);
      toast({
        title: 'Success',
        description: 'Your wallets have been created!',
        variant: 'default'
      });
      
      return data.wallets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error creating wallets";
      console.error("Error creating wallets:", errorMessage);
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'Failed to create user wallets. Using default wallets instead.',
        variant: 'destructive'
      });
      
      // Use default assets on error
      setAssets(Object.values(defaultAssetsMap));
      return null;
    } finally {
      setCreatingWallets(false);
      setLoading(false);
    }
  };

  // Update asset prices when price data changes
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

  // Fetch user wallets on component mount
  useEffect(() => {
    const fetchUserAssets = async () => {
      if (!user || !session?.access_token) {
        console.log("No user or session available, using default assets");
        setAssets(Object.values(defaultAssetsMap));
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log("Fetching wallets for user:", user.id);
        
        // Increased timeout to 15 seconds (from 5 seconds)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error("Wallet fetch timed out after 15 seconds"));
          }, 15000);
        });
        
        // Fetch wallets request with retries
        const fetchWithRetry = async (retries = 2) => {
          try {
            const { data, error } = await supabase
              .from('wallets')
              .select('*')
              .eq('user_id', user.id);
              
            if (error) throw error;
            return { data, error: null };
          } catch (err) {
            if (retries <= 0) throw err;
            
            console.log(`Retrying wallet fetch... (${retries} attempts left)`);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
            return fetchWithRetry(retries - 1);
          }
        };
        
        const walletPromise = fetchWithRetry();
          
        // Race between wallet fetch and timeout  
        const result = await Promise.race([walletPromise, timeoutPromise]);
        
        // Handle the result
        const { data: wallets, error: walletsError } = result as any;
        
        if (walletsError) {
          throw walletsError;
        }
        
        if (!wallets || wallets.length === 0) {
          console.log("No wallets found for user, attempting to create...");
          if (!walletsCreated && !creatingWallets) {
            const newWallets = await createWalletsForUser();
            
            if (newWallets && newWallets.length > 0) {
              processWallets(newWallets);
              return;
            }
          }
          
          // Use default assets if no wallets found
          console.log("Using default assets as no wallets found");
          setAssets(Object.values(defaultAssetsMap));
          setLoading(false);
          return;
        } else {
          console.log(`Found ${wallets.length} wallets for user:`, user.id);
          processWallets(wallets);
          return;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown wallet fetch error";
        console.error('Error fetching wallets:', errorMessage);
        setError(`${errorMessage}. Using default wallet data.`);
        toast({
          title: 'Wallet loading issue',
          description: `${errorMessage}. Using default wallet data.`,
          variant: 'destructive',
          duration: 8000,
        });
        setAssets(Object.values(defaultAssetsMap));
        setLoading(false);
      }
    };

    const processWallets = (wallets: any[]) => {
      try {
        console.log("Processing wallets:", wallets);
        const initialAssets = Object.values(defaultAssetsMap).map(asset => ({...asset}));
        const currencyBalances: Record<string, number> = {};

        wallets.forEach(wallet => {
          const currency = wallet.currency;
          const walletBalance = typeof wallet.balance === 'number' 
            ? wallet.balance 
            : parseFloat(String(wallet.balance)) || 0;
          
          if (!isNaN(walletBalance)) {
            if (!currencyBalances[currency]) {
              currencyBalances[currency] = 0;
            }
            currencyBalances[currency] += walletBalance;
          }
        });
        
        const updatedAssets = initialAssets.map(asset => {
          const balance = currencyBalances[asset.symbol] || 0;
          const assetPrice = prices?.[asset.symbol]?.price || asset.price;
          
          return {
            ...asset,
            amount: balance,
            price: assetPrice,
            value: balance * assetPrice,
            change: prices?.[asset.symbol]?.change_24h || 0
          };
        });
        
        console.log("Processed assets:", updatedAssets);
        setAssets(updatedAssets);
      } catch (processError) {
        console.error("Error processing wallet data:", processError);
        setError("Failed to process wallet data: " + (processError instanceof Error ? processError.message : "Unknown error"));
        // Use default assets as fallback
        setAssets(Object.values(defaultAssetsMap));
      } finally {
        setLoading(false);
      }
    };

    // Start fetching
    fetchUserAssets();
    
    // Ensure we never leave loading state on unmount
    return () => {
      setLoading(false);
    };
  }, [user, prices, session, walletsCreated, creatingWallets, toast]);

  // Safety timeout to ensure we never get stuck in loading state - reduced from 10s to 7s
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("Safety timeout reached - forcing loading state to complete");
        setError("Loading timeout - showing default data");
        setAssets(prevAssets => {
          if (prevAssets.length === 0) {
            return Object.values(defaultAssetsMap);
          }
          return prevAssets;
        });
        setLoading(false);
      }
    }, 7000); // 7 second absolute maximum timeout
    
    return () => clearTimeout(safetyTimer);
  }, [loading]);

  return { 
    assets, 
    loading, 
    isCreatingWallets: creatingWallets,
    error
  };
};
