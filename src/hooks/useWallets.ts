
import { useState, useEffect, useRef, useCallback } from 'react';
import { Asset } from '@/types/assets';
import { useAuth } from '@/components/AuthProvider';
import { CryptoPrices } from '@/hooks/useCryptoPrices';
import { useWalletCache } from '@/hooks/wallet/useWalletCache';
import { useWalletRefresh } from '@/hooks/wallet/useWalletRefresh';
import { useWalletInitializer } from '@/hooks/wallet/useWalletInitializer';

interface UseWalletsProps {
  prices: CryptoPrices;
  skipInitialLoad?: boolean;
}

export const useWallets = ({ prices, skipInitialLoad = false }: UseWalletsProps) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!skipInitialLoad);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const { user, session } = useAuth();
  
  // Use modularized hooks
  const { cacheAssets, getCachedAssets } = useWalletCache();
  const { refreshWallets } = useWalletRefresh({ prices, setError });
  const { initializeWallets } = useWalletInitializer({ 
    prices, 
    setError, 
    setAssets, 
    cacheAssets
  });

  const initialLoadDone = useRef(false);
  
  const reload = useCallback(() => {
    setLoading(true);
    setRefreshCounter(prev => prev + 1);
  }, []);

  // Update asset prices when prices change
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
    
    console.log("Updated assets with new prices:", updatedAssets);
    setAssets(updatedAssets);
    cacheAssets(updatedAssets);
  }, [prices, assets, cacheAssets]);

  // Fetch wallets when user changes or on refresh
  useEffect(() => {
    if (!user || !session?.access_token) {
      console.log("No user or session available");
      return;
    }
    
    // Skip loading if we have cached assets and skipInitialLoad is true
    const cachedAssets = getCachedAssets();
    if (skipInitialLoad && cachedAssets.length > 0 && !refreshCounter) {
      console.log("Using cached assets, skipping load");
      initialLoadDone.current = true;
      setAssets(cachedAssets);
      setLoading(false);
      return;
    }
    
    if (initialLoadDone.current && !refreshCounter) {
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setError(null);
      if (!skipInitialLoad || !cachedAssets.length || refreshCounter > 0) {
        setLoading(true);
      }
      
      try {
        await initializeWallets(user.id);
        initialLoadDone.current = true;
      } finally {
        setLoading(false);
      }
    }, 10);
    
    return () => clearTimeout(timeoutId);
  }, [user?.id, session, refreshCounter, skipInitialLoad, initializeWallets, getCachedAssets]); 

  return { 
    assets, 
    loading,
    error,
    reload
  };
};
