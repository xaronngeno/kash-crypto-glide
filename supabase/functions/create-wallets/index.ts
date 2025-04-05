
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { corsHeaders } from '../_shared/cors.ts';

console.log("Create wallets function initialized");

interface WalletData {
  blockchain: string;
  platform: string;
  address: string;
  currency: string;
}

// This edge function creates wallets for a user if they don't exist
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.split(' ')[1];
    
    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    // Use the service role key for admin privileges
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create client with user token to get user info
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Get the current user using the token
    const { data: { user }, error: userError } = await userClient.auth.getUser(jwt);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Error getting user', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const userId = user.id;
    
    // Check if user already has wallets
    const { data: existingWallets, error: walletsError } = await userClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId);
      
    if (walletsError) {
      return new Response(
        JSON.stringify({ error: 'Error checking existing wallets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If user already has wallets, return them
    if (existingWallets && existingWallets.length > 0) {
      return new Response(
        JSON.stringify({ 
          message: `User already has ${existingWallets.length} wallets`, 
          wallets: existingWallets 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate wallet addresses
    const wallets: WalletData[] = [
      { blockchain: 'Bitcoin', platform: 'Bitcoin', address: `btc-${userId.substring(0, 8)}`, currency: 'BTC' },
      { blockchain: 'Ethereum', platform: 'Ethereum', address: `0xEth${userId.substring(0, 8)}`, currency: 'ETH' },
      { blockchain: 'Solana', platform: 'Solana', address: `sol-${userId.substring(0, 8)}`, currency: 'SOL' },
      { blockchain: 'Sui', platform: 'Sui', address: `sui-${userId.substring(0, 8)}`, currency: 'SUI' },
      { blockchain: 'Ethereum', platform: 'USDT', address: `0xUsdt${userId.substring(0, 8)}`, currency: 'USDT' },
      { blockchain: 'Polygon', platform: 'Polygon', address: `0xMatic${userId.substring(0, 8)}`, currency: 'MATIC' },
      { blockchain: 'Monad', platform: 'Monad Testnet', address: `0xMonad${userId.substring(0, 8)}`, currency: 'MONAD' },
      { blockchain: 'Binance Smart Chain', platform: 'BSC', address: `0xBnb${userId.substring(0, 8)}`, currency: 'BNB' },
      { blockchain: 'XRP Ledger', platform: 'XRPL', address: `xrp-${userId.substring(0, 8)}`, currency: 'XRP' },
      { blockchain: 'Cardano', platform: 'Cardano', address: `ada-${userId.substring(0, 8)}`, currency: 'ADA' },
      { blockchain: 'Dogecoin', platform: 'Dogecoin', address: `doge-${userId.substring(0, 8)}`, currency: 'DOGE' },
      { blockchain: 'Polkadot', platform: 'Polkadot', address: `dot-${userId.substring(0, 8)}`, currency: 'DOT' },
      { blockchain: 'Ethereum', platform: 'Chainlink', address: `0xLink${userId.substring(0, 8)}`, currency: 'LINK' }
    ];
    
    // Insert generated wallets into the database using admin client
    const walletsToInsert = wallets.map(wallet => ({
      user_id: userId,
      blockchain: wallet.blockchain,
      currency: wallet.currency,
      address: wallet.address,
      balance: Math.random() * 10 // Random demo balance
    }));
    
    try {
      const { data: insertedWallets, error: insertError } = await adminClient
        .from('wallets')
        .insert(walletsToInsert)
        .select();
        
      if (insertError) {
        // Handle unique constraint violation by fetching existing wallets
        if (insertError.code === '23505') {
          const { data: allWallets, error: fetchError } = await adminClient
            .from('wallets')
            .select('*')
            .eq('user_id', userId);
            
          if (fetchError) {
            return new Response(
              JSON.stringify({ error: 'Error fetching existing wallets' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: `Found ${allWallets?.length} existing wallets for user ${userId}`,
              wallets: allWallets 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Error inserting wallets' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Created ${insertedWallets?.length} wallets for user ${userId}`,
          wallets: insertedWallets 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Unexpected error during wallet insertion' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
