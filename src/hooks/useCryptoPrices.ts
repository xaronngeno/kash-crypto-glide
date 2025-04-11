import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPlatform {
  name: string;
  logo: string;
}

interface CryptoPrice {
  price: number;
  change_24h: number;
  updated_at: string;
  logo: string;
  name: string;
  symbol: string;
  platform: CryptoPlatform;
  volume?: number;
  marketCap?: number;
  change_7d?: number;
  change_30d?: number;
}

interface CryptoPrices {
  [symbol: string]: CryptoPrice;
}

export function useCryptoPrices() {
  // Start with an empty object instead of fallback prices
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [error, setError] = useState<string | null>(null);
  
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const cachedPricesRef = useRef<CryptoPrices | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const LOCALSTORAGE_CACHE_KEY = 'kash_crypto_prices_cache';

  // Try to load cached data from localStorage on initial mount
  useEffect(() => {
    try {
      const cachedData = localStorage.getItem(LOCALSTORAGE_CACHE_KEY);
      if (cachedData) {
        const { prices: cachedPrices, timestamp } = JSON.parse(cachedData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          setPrices(cachedPrices);
          cachedPricesRef.current = cachedPrices;
          lastFetchTimeRef.current = timestamp;
          console.log('Using cached prices from localStorage');
          return;
        }
      }
    } catch (err) {
      console.error('Error reading from localStorage:', err);
    }
    
    // Set a minimum timeout to fetch prices in the background
    // This creates a near-instant perception while real data loads
    setTimeout(() => {
      fetchPrices(true);
    }, 1); // 1ms delay (practically instant)
  }, []);
  
  const fetchPrices = useCallback(async (forceFetch = false) => {
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    const now = Date.now();
    if (!forceFetch && cachedPricesRef.current && now - lastFetchTimeRef.current < CACHE_DURATION) {
      console.log('Using cached prices from memory');
      setPrices(cachedPricesRef.current);
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setError(null);
      
      console.log('Fetching crypto prices in background...');
      
      const { data, error } = await supabase.functions.invoke('crypto-prices', {
        method: 'GET'
      });
      
      if (error) {
        throw new Error(`Function returned error: ${error.message}`);
      }
      
      if (data && data.prices) {
        console.log('Successfully fetched crypto prices:', Object.keys(data.prices).length, 'coins');
        setPrices(data.prices);
        cachedPricesRef.current = data.prices;
        lastFetchTimeRef.current = now;
        retryCountRef.current = 0;
        
        try {
          localStorage.setItem(LOCALSTORAGE_CACHE_KEY, JSON.stringify({
            prices: data.prices,
            timestamp: now
          }));
        } catch (cacheError) {
          console.warn('Failed to cache prices in localStorage:', cacheError);
        }
        
        if (data.source === 'fallback') {
          console.log('Using fallback prices from the Edge Function');
        } else {
          console.log('Using real-time prices from CoinMarketCap');
        }
      } else {
        console.warn('Edge function returned invalid data format:', data);
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch cryptocurrency prices');
      retryCountRef.current += 1;
      
      if (cachedPricesRef.current) {
        console.log('Using cached prices due to fetch error');
        setPrices(cachedPricesRef.current);
      }
      
      if (retryCountRef.current <= maxRetries) {
        console.log(`Retry attempt ${retryCountRef.current} of ${maxRetries} in 10 seconds...`);
        setTimeout(() => {
          if (!forceFetch) {
            fetchPrices(true);
          }
        }, 10000);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Fetch prices in the background after a minimal delay
    const timeoutId = setTimeout(() => {
      fetchPrices();
    }, 1);
    
    // Set up interval for periodic updates
    const intervalId = setInterval(() => fetchPrices(), 5 * 60 * 1000); // Every 5 minutes
    
    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [fetchPrices]);

  return { 
    prices, 
    loading: false, // Always return false to never show loading state
    error, // Now exposing the error state
    refetch: () => fetchPrices(true) 
  };
}
