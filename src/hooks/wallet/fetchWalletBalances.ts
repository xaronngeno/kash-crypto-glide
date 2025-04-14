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
import { CryptoPrices } from '@/hooks/useCryptoPrices';
import { supabase } from '@/integrations/supabase/client';

interface UseWalletsProps {
  prices: CryptoPrices;
  skipInitialLoad?: boolean;
}

const globalAssetCache: {
  assets: Asset[];
  timestamp: number;
} = {
  assets: [],
  timestamp: 0
};

const CACHE_DURATION = 10 * 60 * 1000;

export const useWallets = ({ prices, skipInitialLoad = false }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>(globalAssetCache.assets);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(globalAssetCache.assets.length === 0 && !skipInitialLoad);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { user, session } = useAuth();
  
  const { walletsCreated, markWalletsAsCreated } = useWalletCreationStatus();
  
  const { processWallets } = useWalletProcessor(prices);
  
  const walletCreationAttempted = useRef(false);
  const initialLoadDone = useRef(globalAssetCache.assets.length > 0);
  
  const reload = useCallback(() => {
    setLoading(true);
    setRefreshCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0 || assets.length === 0) {
      return;
    }
      
    const updatedAssets = assets.map(asset => {
      const priceData = prices[asset.symbol];
      if (priceData) {
        return {
          ...asset,
          price: priceData.price,
          change: priceData.change_24h,
          value: asset.amount * priceData.price,
          logo: priceData.logo || asset.logo,
          name: priceData.name || asset.name,
          platform: priceData.platform || asset.platform
        };
      }
      return asset;
    });
    
    setAssets(updatedAssets);
    
    globalAssetCache.assets = updatedAssets;
    globalAssetCache.timestamp = Date.now();
  }, [prices]); 

  useEffect(() => {
    if (!user || !session?.access_token) {
      console.log("No user or session available");
      return;
    }
    
    const now = Date.now();
    const cacheIsValid = (now - globalAssetCache.timestamp) < CACHE_DURATION;
    
    if (skipInitialLoad && cacheIsValid && globalAssetCache.assets.length > 0) {
      console.log("Using cached assets, skipping load");
      initialLoadDone.current = true;
      setLoading(false);
      return;
    }
    
    if (initialLoadDone.current && !refreshCounter) {
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setError(null);
      if (!skipInitialLoad || !cacheIsValid || globalAssetCache.assets.length === 0) {
        setLoading(true);
      }
      
      try {
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
          
          if (!walletsCreated && !walletCreationAttempted.current) {
            walletCreationAttempted.current = true;
            
            try {
              const newWallets = await createUserWallets(user.id);
              if (newWallets && newWallets.length > 0) {
                markWalletsAsCreated();
                const processedAssets = processWallets(newWallets);
                setAssets(processedAssets);
                
                globalAssetCache.assets = processedAssets;
                globalAssetCache.timestamp = Date.now();
              }
            } catch (createError) {
              console.error("Error creating wallets:", createError);
            }
          }
          
          return;
        }
        
        const processedAssets = processWallets(wallets);
        setAssets(processedAssets);
        initialLoadDone.current = true;
        
        globalAssetCache.assets = processedAssets;
        globalAssetCache.timestamp = Date.now();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error('Error in useWallets:', errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [user?.id, session, processWallets, walletsCreated, markWalletsAsCreated, refreshCounter, skipInitialLoad]); 

  return { 
    assets, 
    loading,
    error,
    reload
  };
};

/**
 * Force refresh wallet balances and addresses
 */
export const refreshWalletBalances = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-wallet-balances', {
      method: 'POST',
      body: { userId, forceRefresh: true }
    });
    
    if (error) {
      console.error("Error refreshing wallet balances:", error);
      return false;
    }
    
    console.log("Wallet balances refreshed successfully:", data);
    return true;
  } catch (error) {
    console.error("Error refreshing wallet balances:", error);
    return false;
  }
};
