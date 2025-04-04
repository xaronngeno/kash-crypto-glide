
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
      
      // Maximum number of retries
      const maxRetries = 2;
      let currentRetry = 0;
      let success = false;
      
      while (currentRetry <= maxRetries && !success) {
        try {
          if (currentRetry > 0) {
            console.log(`Retry attempt ${currentRetry}/${maxRetries}...`);
          }
          
          const { data, error: functionError } = await supabase.functions.invoke('crypto-prices', {
            body: { timestamp: new Date().toISOString() }
          });
          
          if (functionError) {
            console.error('Edge function error:', functionError);
            throw new Error(functionError.message || 'Failed to invoke crypto prices function');
          }
          
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
            
            success = true;
            break;
          } else {
            console.warn('Edge function returned invalid data format');
            throw new Error('Invalid data format');
          }
        } catch (retryError) {
          console.error(`Attempt ${currentRetry + 1} failed:`, retryError);
          currentRetry++;
          
          if (currentRetry > maxRetries) {
            throw retryError;
          }
          
          // Wait before next retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * currentRetry));
        }
      }
    } catch (err) {
      console.error('All fetch attempts failed:', err);
      setError(err instanceof Error ? err.message : 'Unable to fetch live prices');
      
      toast({
        title: "Using cached prices",
        description: err instanceof Error ? err.message : "Could not connect to price service after multiple attempts.",
        variant: "default"
      });
      
      // Ensure we always have prices
      if (Object.keys(prices).length === 0) {
        setPrices(fallbackPrices);
      }
    } finally {
      setLoading(false);
    }
  }, [toast, prices]);

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
