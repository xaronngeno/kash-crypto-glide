
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

const fallbackPrices: CryptoPrices = {
  BTC: { 
    price: 64000, 
    change_24h: 1.5, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png",
    name: "Bitcoin",
    symbol: "BTC",
    platform: { name: "Bitcoin", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png" }
  },
  ETH: { 
    price: 3200, 
    change_24h: 0.8, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    name: "Ethereum",
    symbol: "ETH",
    platform: { name: "Ethereum", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" }
  },
  USDT: { 
    price: 1.00, 
    change_24h: 0.01, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/825.png",
    name: "Tether",
    symbol: "USDT",
    platform: { name: "Ethereum", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" }
  },
  SOL: { 
    price: 120, 
    change_24h: 2.3, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
    name: "Solana",
    symbol: "SOL",
    platform: { name: "Solana", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png" }
  },
  TRX: { 
    price: 0.12, 
    change_24h: 1.1, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png",
    name: "Tron",
    symbol: "TRX",
    platform: { name: "Tron", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png" }
  },
  MATIC: { 
    price: 0.75, 
    change_24h: 1.2, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
    name: "Polygon",
    symbol: "MATIC",
    platform: { name: "Ethereum", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" }
  },
  SUI: { 
    price: 0.85, 
    change_24h: 1.5, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png",
    name: "Sui",
    symbol: "SUI",
    platform: { name: "Sui", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/20947.png" }
  },
  MONAD: { 
    price: 12.25, 
    change_24h: 3.7, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/28126.png",
    name: "Monad",
    symbol: "MONAD",
    platform: { name: "Monad", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/28126.png" }
  }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const LOCALSTORAGE_CACHE_KEY = 'kash_crypto_prices_cache';

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrices>(fallbackPrices); // Initialize with fallback prices immediately
  const [loading, setLoading] = useState(false); // Start with loading false for instant UI
  const [error, setError] = useState<string | null>(null);
  
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const cachedPricesRef = useRef<CryptoPrices | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;

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
    // Fetch prices in the background
    fetchPrices();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(() => fetchPrices(), 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [fetchPrices]);

  return { 
    prices, 
    loading: false, // Always return false to never show loading state
    error: null, // Don't surface errors to UI
    refetch: () => fetchPrices(true) 
  };
}
