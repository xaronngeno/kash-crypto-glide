
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Improved CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Fallback prices to use if API is unavailable
const fallbackPrices = {
  BTC: { price: 64000, change_24h: 1.5, updated_at: new Date().toISOString() },
  ETH: { price: 3200, change_24h: 0.8, updated_at: new Date().toISOString() },
  USDT: { price: 1.00, change_24h: 0.01, updated_at: new Date().toISOString() },
  SOL: { price: 120, change_24h: 2.3, updated_at: new Date().toISOString() },
};

// Cache for storing the last successful API response
let priceCache = {
  data: null as any,
  timestamp: 0,
  source: 'fallback'
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

serve(async (req) => {
  console.log("Crypto prices function called", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Origin': '*',
      }, 
      status: 204 
    });
  }

  try {
    // Check if we have a valid cache that's not expired
    const now = Date.now();
    if (priceCache.data && (now - priceCache.timestamp) < CACHE_DURATION) {
      console.log("Returning cached prices from edge function memory");
      
      return new Response(
        JSON.stringify(priceCache.data),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const apiKey = Deno.env.get('COINMARKETCAP_API_KEY');
    console.log("Attempting to retrieve API key:", !!apiKey);
    
    if (!apiKey) {
      console.error('Missing CoinMarketCap API key');
      return new Response(
        JSON.stringify({ 
          prices: fallbackPrices,
          source: 'fallback',
          error: 'Missing API key'
        }),
        { 
          status: 200, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    const symbols = ['BTC', 'ETH', 'USDT', 'SOL'];
    
    try {
      console.log('Requesting data from CoinMarketCap API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbols.join(',')}`, 
        {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept': 'application/json',
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      console.log("CoinMarketCap API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CoinMarketCap API error:', errorText);
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        console.error('Invalid API response format:', JSON.stringify(data));
        throw new Error('Invalid API response format');
      }
      
      const prices = {};
      
      for (const symbol of symbols) {
        if (data.data && data.data[symbol]) {
          const crypto = data.data[symbol];
          prices[symbol] = {
            price: crypto.quote.USD.price,
            change_24h: crypto.quote.USD.percent_change_24h,
            updated_at: new Date().toISOString(),
          };
        }
      }

      console.log('Successfully fetched prices', Object.keys(prices).join(', '));
      
      const responseData = { prices, source: 'api' };
      priceCache = {
        data: responseData,
        timestamp: now,
        source: 'api'
      };
      
      return new Response(
        JSON.stringify(responseData),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (fetchError) {
      console.error('Error fetching from CoinMarketCap:', fetchError.message);
      
      return new Response(
        JSON.stringify({ 
          prices: fallbackPrices,
          source: 'fallback',
          error: fetchError.message
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in crypto-prices function:', error.message);
    
    return new Response(
      JSON.stringify({ 
        prices: fallbackPrices,
        source: 'fallback',
        error: error.message
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
