
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback prices to use if API is unavailable
const fallbackPrices = {
  BTC: { price: 64000, change_24h: 1.5, updated_at: new Date().toISOString() },
  ETH: { price: 3200, change_24h: 0.8, updated_at: new Date().toISOString() },
  USDT: { price: 1.00, change_24h: 0.01, updated_at: new Date().toISOString() },
  SOL: { price: 120, change_24h: 2.3, updated_at: new Date().toISOString() },
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const apiKey = Deno.env.get('COINMARKETCAP_API_KEY');
    
    if (!apiKey) {
      console.error('Missing CoinMarketCap API key');
      // If API key is missing, return fallback prices instead of an error
      console.log('Using fallback prices due to missing API key');
      return new Response(
        JSON.stringify({ 
          prices: fallbackPrices,
          source: 'fallback'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Define which cryptocurrencies we want to fetch
    const symbols = ['BTC', 'ETH', 'USDT', 'SOL'];
    
    try {
      const response = await fetch(
        'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=' + symbols.join(','), 
        {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('CoinMarketCap API error:', errorText);
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Transform the data to a more usable format for our frontend
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

      console.log('Successfully fetched prices for', Object.keys(prices).join(', '));
      
      // Return the successful response with prices
      return new Response(
        JSON.stringify({ prices, source: 'api' }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
          } 
        }
      );
    } catch (fetchError) {
      console.error('Error fetching from CoinMarketCap:', fetchError.message);
      
      // Return fallback prices if API fetch fails
      console.log('Using fallback prices due to API error');
      return new Response(
        JSON.stringify({ 
          prices: fallbackPrices,
          source: 'fallback'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in crypto-prices function:', error.message);
    
    // Even in case of unexpected errors, return fallback prices
    // This ensures the frontend always gets something usable
    return new Response(
      JSON.stringify({ 
        prices: fallbackPrices,
        source: 'fallback',
        error: error.message
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
