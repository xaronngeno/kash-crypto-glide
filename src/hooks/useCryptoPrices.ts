
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CryptoPrice {
  price: number;
  change_24h: number;
  updated_at: string;
}

interface CryptoPrices {
  [symbol: string]: CryptoPrice;
}

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        } else {
          setError('Invalid response format from API');
        }
      } catch (err) {
        console.error('Error fetching crypto prices:', err);
        setError(err.message || 'Failed to fetch crypto prices');
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchPrices();
    
    // Set up polling every 5 minutes (CoinMarketCap has rate limits)
    const intervalId = setInterval(fetchPrices, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  return { prices, loading, error };
}
