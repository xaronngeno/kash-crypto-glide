
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get wallets from database with a shorter timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500); // Reduced timeout for faster response

    try {
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('blockchain, currency, address, balance, wallet_type')
        .eq('user_id', userId)
        .abortSignal(controller.signal);
      
      clearTimeout(timeout);
      
      if (walletsError) {
        throw walletsError;
      }

      if (!wallets || wallets.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'No wallets found for user',
            wallets: [],
            shouldCreateWallets: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Process wallets efficiently
      const walletsWithBalances = wallets.map(wallet => ({
        ...wallet,
        balance: parseFloat(wallet.balance as any) || 0
      }));

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Wallet balances fetched successfully',
          wallets: walletsWithBalances
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (abortError) {
      if (abortError.name === 'AbortError') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Database query timed out',
            message: 'Database query timed out, please try again'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 408 }
        );
      }
      throw abortError;
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        message: 'Failed to fetch wallet data'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
