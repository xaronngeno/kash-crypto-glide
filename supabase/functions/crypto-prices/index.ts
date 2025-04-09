
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

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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

    // Use the API key the user provided if the environment variable isn't set
    const apiKey = Deno.env.get('COINMARKETCAP_API_KEY') || '891bdf88-f6a6-4045-89bc-d762256487f3';
    console.log("Attempting to use API key:", apiKey ? "API key available" : "No API key");
    
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

    // Define main cryptocurrencies we want to ensure are included
    const mainCoins = ['BTC', 'ETH', 'USDT', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'DOT', 'LINK', 'MATIC', 'SUI'];
    const limit = 100; // Number of top cryptocurrencies to fetch
    
    try {
      console.log('Requesting data from CoinMarketCap API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      // Use the listings/latest endpoint to get more detailed data
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
      
      console.log("CoinMarketCap API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CoinMarketCap API error:', errorText);
        throw new Error(`API responded with status ${response.status}: ${errorText}`);
      }

      const listingsData = await response.json();
      
      if (!listingsData.data) {
        console.error('Invalid API response format:', JSON.stringify(listingsData));
        throw new Error('Invalid API response format');
      }
      
      // Filter out known invalid IDs that cause metadata API issues
      // This is to avoid the "Invalid value for id: 36119" error
      const validCryptos = listingsData.data.filter((crypto: any) => {
        // Skip cryptocurrencies with problematic IDs
        const problematicIds = [36119, 36118, 36117, 36116]; 
        return !problematicIds.includes(crypto.id);
      });

      // Now fetch metadata with logos and platform info
      const ids = validCryptos.map((crypto: any) => crypto.id).join(',');
      
      const metadataController = new AbortController();
      const metadataTimeoutId = setTimeout(() => metadataController.abort(), 10000);
      
      const metadataResponse = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/info?id=${ids}`, 
        {
          headers: {
            'X-CMC_PRO_API_KEY': apiKey,
            'Accept': 'application/json',
          },
          signal: metadataController.signal
        }
      );
      
      clearTimeout(metadataTimeoutId);
      
      if (!metadataResponse.ok) {
        const errorText = await metadataResponse.text();
        console.error('CoinMarketCap Metadata API error:', errorText);
        throw new Error(`Metadata API responded with status ${metadataResponse.status}: ${errorText}`);
      }
      
      const metadataData = await metadataResponse.json();
      
      if (!metadataData.data) {
        console.error('Invalid metadata API response format:', JSON.stringify(metadataData));
        throw new Error('Invalid metadata API response format');
      }
      
      const prices: Record<string, any> = {};
      
      for (const crypto of validCryptos) {
        const symbol = crypto.symbol;
        const metadata = metadataData.data[crypto.id];
        
        if (metadata) {
          prices[symbol] = {
            price: crypto.quote.USD.price,
            change_24h: crypto.quote.USD.percent_change_24h,
            updated_at: new Date().toISOString(),
            logo: metadata.logo,
            name: metadata.name,
            symbol: symbol,
            platform: metadata.platform || { 
              name: metadata.name, // Default to the token name if no platform
              logo: metadata.logo
            }
          };
        }
      }
      
      // Ensure all the main coins are included by using fallbacks if needed
      for (const coin of mainCoins) {
        if (!prices[coin] && fallbackPrices[coin as keyof typeof fallbackPrices]) {
          console.log(`Using fallback data for ${coin}`);
          prices[coin] = {
            ...fallbackPrices[coin as keyof typeof fallbackPrices],
            updated_at: new Date().toISOString()
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
      
      // Always return a valid response even if the API fails
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
