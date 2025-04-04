
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('COINMARKETCAP_API_KEY');
    
    if (!apiKey) {
      console.error('Missing CoinMarketCap API key');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Define which cryptocurrencies we want to fetch
    const symbols = ['BTC', 'ETH', 'USDT', 'SOL'];
    
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
      return new Response(
        JSON.stringify({ error: 'Failed to fetch crypto prices' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    
    return new Response(
      JSON.stringify({ prices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in crypto-prices function:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
