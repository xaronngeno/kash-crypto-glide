import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Improved CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Fallback prices to use if API is unavailable
const fallbackPrices = {
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
  BNB: { 
    price: 580, 
    change_24h: 1.2, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
    name: "Binance Coin",
    symbol: "BNB",
    platform: { name: "BNB Chain", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png" }
  },
  XRP: { 
    price: 0.58, 
    change_24h: -0.5, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png",
    name: "XRP",
    symbol: "XRP",
    platform: { name: "XRP Ledger", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png" }
  },
  ADA: { 
    price: 0.45, 
    change_24h: 0.3, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png",
    name: "Cardano",
    symbol: "ADA",
    platform: { name: "Cardano", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/2010.png" }
  },
  DOGE: { 
    price: 0.15, 
    change_24h: -1.0, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png",
    name: "Dogecoin",
    symbol: "DOGE",
    platform: { name: "Dogecoin", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png" }
  },
  DOT: { 
    price: 6.80, 
    change_24h: 1.8, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png",
    name: "Polkadot",
    symbol: "DOT",
    platform: { name: "Polkadot", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/6636.png" }
  },
  LINK: { 
    price: 14.50, 
    change_24h: 2.7, 
    updated_at: new Date().toISOString(),
    logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1975.png",
    name: "Chainlink",
    symbol: "LINK",
    platform: { name: "Ethereum", logo: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" }
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

// Cache for storing the last successful API response
let priceCache = {
  data: null as any,
  timestamp: 0,
  source: 'fallback'
};

// Increased cache duration to 10 minutes to reduce API calls
const CACHE_DURATION = 10 * 60 * 1000;

serve(async (req) => {
  console.log("Crypto prices function called", new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: {
        ...corsHeaders,
      }, 
      status: 204 
    });
  }

  try {
    // Return fallback prices immediately on first request to improve speed
    // This gives instant response while real data is fetched in the background
    const now = Date.now();
    const immediateResponse = {
      prices: fallbackPrices,
      source: 'fallback-immediate',
      cached: false
    };

    // Check if we have a valid cache that's not expired
    if (priceCache.data && (now - priceCache.timestamp) < CACHE_DURATION) {
      console.log("Returning cached prices from edge function memory");
      return new Response(
        JSON.stringify(priceCache.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Start fetching real prices in the background
    const fetchPromise = (async () => {
      try {
        const apiKey = Deno.env.get('COINMARKETCAP_API_KEY') || '891bdf88-f6a6-4045-89bc-d762256487f3';
        
        if (!apiKey) {
          console.error('Missing CoinMarketCap API key');
          return;
        }

        const mainCoins = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'MATIC', 'SUI'];
        const limit = 50; // Reduced number of coins to fetch
        
        console.log('Requesting data from CoinMarketCap API in background...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // Simple request with fewer details to speed up the response
        const response = await fetch(
          `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${limit}&convert=USD`, 
          {
            headers: {
              'X-CMC_PRO_API_KEY': apiKey,
              'Accept': 'application/json',
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('CoinMarketCap API error:', errorText);
          return;
        }

        const listingsData = await response.json();
        
        if (!listingsData.data) {
          console.error('Invalid API response format:', JSON.stringify(listingsData));
          return;
        }
        
        // Filter out known invalid IDs
        const validCryptos = listingsData.data.filter((crypto: any) => {
          const problematicIds = [36119, 36118, 36117, 36116]; 
          return !problematicIds.includes(crypto.id);
        });

        // Simplified response - skip metadata fetch to improve speed
        const prices: Record<string, any> = {};
        
        for (const crypto of validCryptos) {
          const symbol = crypto.symbol;
          
          prices[symbol] = {
            price: crypto.quote.USD.price,
            change_24h: crypto.quote.USD.percent_change_24h,
            updated_at: new Date().toISOString(),
            logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png`, // Use default URL pattern
            name: crypto.name,
            symbol: symbol,
            platform: { 
              name: crypto.name,
              logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${crypto.id}.png`
            }
          };
        }
        
        // Ensure all the main coins are included by using fallbacks if needed
        for (const coin of mainCoins) {
          if (!prices[coin] && fallbackPrices[coin as keyof typeof fallbackPrices]) {
            prices[coin] = {
              ...fallbackPrices[coin as keyof typeof fallbackPrices],
              updated_at: new Date().toISOString()
            };
          }
        }

        console.log('Successfully fetched prices in background', Object.keys(prices).join(', '));
        
        const responseData = { prices, source: 'api' };
        priceCache = {
          data: responseData,
          timestamp: now,
          source: 'api'
        };
      } catch (fetchError) {
        console.error('Error fetching from CoinMarketCap in background:', fetchError.message);
      }
    })();

    // If this is enabled in Deno Deploy, use waitUntil to continue fetching after response
    // @ts-ignore - EdgeRuntime might not be available in all environments
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(fetchPromise);
    }
    
    // Return immediate response with fallback data
    return new Response(
      JSON.stringify(immediateResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error in crypto-prices function:', error.message);
    
    return new Response(
      JSON.stringify({ 
        prices: fallbackPrices,
        source: 'fallback',
        error: error.message
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
