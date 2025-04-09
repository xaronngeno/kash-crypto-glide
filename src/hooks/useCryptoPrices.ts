
import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
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

const CACHE_DURATION = 60 * 1000; 

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrices>(fallbackPrices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const cachedPricesRef = useRef<CryptoPrices | null>(null);
  const retryCountRef = useRef<number>(0);
  const maxRetries = 3;
  
  const fetchPrices = useCallback(async (forceFetch = false) => {
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    const now = Date.now();
    if (!forceFetch && cachedPricesRef.current && now - lastFetchTimeRef.current < CACHE_DURATION) {
      console.log('Using cached prices from memory');
      setPrices(cachedPricesRef.current);
      setLoading(false);
      return;
    }
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('Fetching crypto prices...');
      
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
        
        if (data.source === 'fallback') {
          console.log('Using fallback prices from the Edge Function');
          // Don't show toast for cached prices to avoid annoying the user
          if (data.error && data.error.includes('Invalid value for')) {
            // Silent recovery for known API issue
            console.warn('Known API error:', data.error);
          } else {
            toast({
              title: "Using cached prices",
              description: data.error ? `Network issue - Using cached data` : "Could not connect to price service.",
              variant: "default"
            });
          }
        } else {
          console.log('Using real-time prices from CoinMarketCap');
        }
      } else {
        console.warn('Edge function returned invalid data format:', data);
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError(err instanceof Error ? err.message : 'Unable to fetch live prices');
      retryCountRef.current += 1;
      
      if (cachedPricesRef.current) {
        console.log('Using cached prices due to fetch error');
        setPrices(cachedPricesRef.current);
        toast({
          title: "Using cached prices",
          description: "Could not connect to price service.",
          variant: "default"
        });
      } else {
        console.log('Using default fallback prices');
        setPrices(fallbackPrices);
        toast({
          title: "Using default prices",
          description: "Could not connect to price service.",
          variant: "default"
        });
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
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [toast]);

  const stableFetchPrices = useCallback(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    stableFetchPrices();
    
    const intervalId = setInterval(stableFetchPrices, 1 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [stableFetchPrices]);

  useEffect(() => {
    console.log('Current crypto prices in state:', Object.keys(prices).length, 'coins');
  }, [prices]);

  return { 
    prices, 
    loading, 
    error, 
    refetch: () => fetchPrices(true) 
  };
}
