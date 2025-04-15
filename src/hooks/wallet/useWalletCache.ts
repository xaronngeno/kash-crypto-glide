
import { useCallback } from 'react';
import { Asset } from '@/types/assets';

// Global cache for asset data
const globalAssetCache: {
  assets: Asset[];
  timestamp: number;
} = {
  assets: [],
  timestamp: 0
};

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export const useWalletCache = () => {
  /**
   * Store assets in the global cache
   */
  const cacheAssets = useCallback((assets: Asset[]) => {
    globalAssetCache.assets = assets;
    globalAssetCache.timestamp = Date.now();
  }, []);
  
  /**
   * Get cached assets if available and not expired
   */
  const getCachedAssets = useCallback(() => {
    const now = Date.now();
    const cacheIsValid = (now - globalAssetCache.timestamp) < CACHE_DURATION;
    
    if (cacheIsValid && globalAssetCache.assets.length > 0) {
      return globalAssetCache.assets;
    }
    
    return [];
  }, []);
  
  /**
   * Check if cache is valid
   */
  const isCacheValid = useCallback(() => {
    const now = Date.now();
    const cacheIsValid = (now - globalAssetCache.timestamp) < CACHE_DURATION;
    
    return cacheIsValid && globalAssetCache.assets.length > 0;
  }, []);
  
  return {
    cacheAssets,
    getCachedAssets,
    isCacheValid,
  };
};
