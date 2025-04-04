
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
  
  // Define fetchPrices as a useCallback to avoid dependency issues
  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      console.log('Fetching crypto prices...');
      
      // Try to fetch from the Edge Function
      try {
        const { data, error: functionError } = await supabase.functions.invoke('crypto-prices');
        
        if (functionError) {
          console.error('Edge function error:', functionError);
          throw new Error(functionError.message);
        }
        
        if (data && data.prices) {
          console.log('Successfully fetched crypto prices:', data.prices);
          setPrices(data.prices);
          return;
        } else {
          console.warn('Edge function returned invalid data format');
          throw new Error('Invalid data format');
        }
      } catch (apiError) {
        console.error('Failed to fetch from crypto price service:', apiError);
        
        // Only show the toast if we don't already have an error displayed
        if (!error) {
          toast({
            title: "Using cached prices",
            description: "Could not connect to price service. Using latest available prices.",
            variant: "default"
          });
        }
        
        // Continue using fallback prices
        throw apiError;
      }
    } catch (err) {
      // Edge function failed or returned invalid data
      // Use fallback prices and set error state
      console.log('Using fallback crypto prices');
      
      // Only update prices if we don't already have prices
      if (Object.keys(prices).length === 0) {
        setPrices(fallbackPrices);
      }
      
      setError('Unable to fetch live prices');
    } finally {
      setLoading(false);
    }
  }, [error, toast, prices]);

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
