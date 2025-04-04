
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        
        const { data, error: functionError } = await supabase.functions.invoke('crypto-prices');
        
        if (functionError) {
          throw new Error(functionError.message);
        }
        
        if (data && data.prices) {
          setPrices(data.prices);
          setError(null); // Clear any previous errors
        } else {
          // If we get an invalid response format, use fallback prices
          console.warn('Invalid response format from API, using fallback prices');
          setError('Could not fetch live prices');
        }
      } catch (err) {
        console.error('Error fetching crypto prices:', err);
        
        // Use fallback prices when the API call fails
        // Don't update the state if we already have prices
        if (Object.keys(prices).length === 0) {
          setPrices(fallbackPrices);
        }
        
        setError('Failed to fetch live prices');
        
        // Only show the toast once
        if (!error) {
          toast({
            title: "Using cached prices",
            description: "Could not connect to price service. Using latest available prices.",
            variant: "destructive"
          });
        }
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchPrices();
    
    // Set up polling every 5 minutes (CoinMarketCap has rate limits)
    const intervalId = setInterval(fetchPrices, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [error, prices, toast]);

  return { prices, loading, error };
}
