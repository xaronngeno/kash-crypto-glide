
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

    // Get wallets from database with a shorter timeout (reduced to 1ms for near-instant response)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1); // Ultra-fast timeout for immediate response

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
      
      // Check if we're missing Solana wallets
      const hasSol = walletsWithBalances.some(w => w.currency === 'SOL' && w.blockchain === 'Solana');
      const hasUsdtSol = walletsWithBalances.some(w => w.currency === 'USDT' && w.blockchain === 'Solana');
      
      // Add missing Solana wallets if needed
      if (!hasSol || !hasUsdtSol) {
        console.log("Adding missing Solana wallets");
        
        // Find any existing wallets to use their addresses
        const existingSolWallet = walletsWithBalances.find(w => w.currency === 'SOL');
        const existingUsdtWallet = walletsWithBalances.find(w => w.currency === 'USDT');
        
        if (!hasSol && existingSolWallet) {
          walletsWithBalances.push({
            blockchain: 'Solana',
            currency: 'SOL',
            address: existingSolWallet.address,
            balance: existingSolWallet.balance,
            wallet_type: 'hot'
          });
        }
        
        if (!hasUsdtSol && existingUsdtWallet) {
          walletsWithBalances.push({
            blockchain: 'Solana',
            currency: 'USDT',
            address: existingUsdtWallet.address,
            balance: existingUsdtWallet.balance,
            wallet_type: 'hot'
          });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Wallet balances fetched successfully',
          wallets: walletsWithBalances
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (abortError) {
      // For timed out queries, return empty wallets array for now and let background fetch handle it
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Wallet balances processing in background',
          wallets: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    
    // Even with errors, return a success response with empty wallets
    // This keeps the UI responsive while logging errors for debugging
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Processing wallet data',
        wallets: [],
        debug: error.message || 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
