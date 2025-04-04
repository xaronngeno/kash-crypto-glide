
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CryptoPrice {
  price: number;
  change_24h: number;
  updated_at: string;
}

interface CryptoPrices {
  [symbol: string]: CryptoPrice;
}

// Default prices to use when API is unavailable
const fallbackPrices: CryptoPrices = {
  BTC: { price: 64000, change_24h: 1.5, updated_at: new Date().toISOString() },
  ETH: { price: 3200, change_24h: 0.8, updated_at: new Date().toISOString() },
  USDT: { price: 1.00, change_24h: 0.01, updated_at: new Date().toISOString() },
  SOL: { price: 120, change_24h: 2.3, updated_at: new Date().toISOString() },
};

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrices>(fallbackPrices);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching crypto prices...');
      
      // Call the edge function directly with no auth requirement
      const response = await fetch('https://hfdaowgithffhelybfve.supabase.co/functions/v1/crypto-prices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // No authorization header needed since we disabled JWT verification
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      if (data && data.prices) {
        console.log('Successfully fetched crypto prices:', data.prices);
        setPrices(data.prices);
        
        if (data.source === 'fallback') {
          console.log('Using fallback prices from the Edge Function');
          toast({
            title: "Using cached prices",
            description: data.error ? `Error: ${data.error}` : "Could not connect to price service.",
            variant: "default"
          });
        } else {
          console.log('Using real-time prices from CoinMarketCap');
        }
      } else {
        console.warn('Edge function returned invalid data format');
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error('Failed to fetch prices:', err);
      setError(err instanceof Error ? err.message : 'Unable to fetch live prices');
      
      // Always make sure we have prices, even if there's an error
      setPrices(fallbackPrices);
      
      toast({
        title: "Using default prices",
        description: err instanceof Error ? err.message : "Could not connect to price service.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Fetch immediately on mount
    fetchPrices();
    
    // Set up polling every 2 minutes
    const intervalId = setInterval(fetchPrices, 2 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchPrices]);

  // For debugging - log the current prices whenever they change
  useEffect(() => {
    console.log('Current crypto prices:', prices);
  }, [prices]);

  return { prices, loading, error, refetch: fetchPrices };
}
