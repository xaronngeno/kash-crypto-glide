
import { useState, useEffect, useRef, useCallback } from 'react';
import { Asset } from '@/types/assets';
import { useAuth } from '@/components/AuthProvider';
import { 
  fetchWalletBalances,
  createUserWallets,
  useWalletCreationStatus,
  useWalletProcessor
} from '@/hooks/wallet';
import { toast } from '@/hooks/use-toast';

interface UseWalletsProps {
  prices: Record<string, { price: number; change_24h: number }>;
  skipInitialLoad?: boolean;
}

// Global cache to store asset data across component instances
const globalAssetCache: {
  assets: Asset[];
  timestamp: number;
} = {
  assets: [],
  timestamp: 0
};

// Cache duration in milliseconds (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

export const useWallets = ({ prices, skipInitialLoad = false }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>(globalAssetCache.assets);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(globalAssetCache.assets.length === 0 && !skipInitialLoad);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { user, session } = useAuth();
  
  // Track wallet creation status
  const { walletsCreated, markWalletsAsCreated } = useWalletCreationStatus();
  
  // Get the wallet processor
  const { processWallets } = useWalletProcessor(prices);
  
  // Flag to prevent multiple wallet creation attempts
  const walletCreationAttempted = useRef(false);
  // Flag to track if initial load has been done
  const initialLoadDone = useRef(globalAssetCache.assets.length > 0);
  
  // Function to manually reload wallet data
  const reload = useCallback(() => {
    setLoading(true);
    setRefreshCounter(prev => prev + 1);
  }, []);
  
  // Update asset prices when prices change
  useEffect(() => {
    if (prices && Object.keys(prices).length > 0 && assets.length > 0) {
      const updatedAssets = assets.map(asset => {
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
      });
      
      setAssets(updatedAssets);
      
      // Update global cache with new prices
      globalAssetCache.assets = updatedAssets;
      globalAssetCache.timestamp = Date.now();
    }
  }, [prices, assets]);

  // Fetch user assets with a small delay to allow UI to render first
  useEffect(() => {
    // Skip loading if we have cached assets and skipInitialLoad is true
    const now = Date.now();
    const cacheIsValid = (now - globalAssetCache.timestamp) < CACHE_DURATION;
    
    if (skipInitialLoad && cacheIsValid && globalAssetCache.assets.length > 0) {
      console.log("Using cached assets, skipping load");
      initialLoadDone.current = true;
      setLoading(false);
      return;
    }
    
    // Small timeout to let React render first
    const timeoutId = setTimeout(() => {
      const loadUserAssets = async () => {
        if (!user || !session?.access_token) {
          console.log("No user or session available");
          return;
        }
        
        setError(null);
        if (!skipInitialLoad || !cacheIsValid || globalAssetCache.assets.length === 0) {
          setLoading(true);
        }
        
        try {
          // Fetch wallet balances
          const wallets = await fetchWalletBalances({
            userId: user.id,
            onError: (err) => {
              setError(err.message);
              toast({
                title: "Error",
                description: "Failed to load wallet data",
                variant: "destructive"
              });
            }
          });
          
          if (!wallets || wallets.length === 0) {
            console.log("No wallets found, creating initial wallets");
            
            // Only create wallets once and only if not created before
            if (!walletsCreated && !walletCreationAttempted.current) {
              walletCreationAttempted.current = true;
              
              try {
                const newWallets = await createUserWallets(user.id);
                if (newWallets && newWallets.length > 0) {
                  markWalletsAsCreated();
                  const processedAssets = processWallets(newWallets);
                  setAssets(processedAssets);
                  
                  // Update global cache
                  globalAssetCache.assets = processedAssets;
                  globalAssetCache.timestamp = Date.now();
                }
              } catch (createError) {
                console.error("Error creating wallets:", createError);
                // Don't show toast here as the fetchWalletBalances already shows one
              }
            }
            
            return;
          }
          
          // Process the wallet data into assets
          const processedAssets = processWallets(wallets);
          setAssets(processedAssets);
          initialLoadDone.current = true;
          
          // Update global cache
          globalAssetCache.assets = processedAssets;
          globalAssetCache.timestamp = Date.now();
          
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          console.error('Error in useWallets:', errorMessage);
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      };
  
      loadUserAssets();
      
    }, 10); // Small delay
    
    return () => clearTimeout(timeoutId);
  }, [user, session, processWallets, walletsCreated, markWalletsAsCreated, refreshCounter, skipInitialLoad]);

  return { 
    assets, 
    loading,
    error,
    reload
  };
};
