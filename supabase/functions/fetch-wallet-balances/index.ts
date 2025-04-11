
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

    console.log(`Fetching wallets for user ${userId}`);

    // Get wallets from database
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('blockchain, currency, address, balance, wallet_type')
      .eq('user_id', userId);
    
    if (walletsError) {
      console.error('Error fetching wallets:', walletsError.message);
      throw walletsError;
    }

    console.log(`Found ${wallets?.length || 0} wallets for user ${userId}`);

    if (!wallets || wallets.length === 0) {
      console.log('No wallets found, triggering wallet creation');
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
    
    // Check if we're missing Solana or Bitcoin wallets
    const hasSol = walletsWithBalances.some(w => w.currency === 'SOL' && w.blockchain === 'Solana');
    const hasUsdtSol = walletsWithBalances.some(w => w.currency === 'USDT' && w.blockchain === 'Solana');
    const hasBtcTaproot = walletsWithBalances.some(w => w.currency === 'BTC' && w.blockchain === 'Bitcoin' && w.wallet_type === 'Taproot');
    const hasBtcSegwit = walletsWithBalances.some(w => w.currency === 'BTC' && w.blockchain === 'Bitcoin' && w.wallet_type === 'Native SegWit');
    
    console.log(`Has SOL wallet: ${hasSol}, Has USDT on Solana: ${hasUsdtSol}`);
    console.log(`Has BTC Taproot: ${hasBtcTaproot}, Has BTC SegWit: ${hasBtcSegwit}`);
    
    // Add missing wallets if needed
    if (!hasSol || !hasUsdtSol || !hasBtcTaproot || !hasBtcSegwit) {
      console.log("Adding missing wallets");
      
      // Find any existing wallets to use their addresses
      const existingSolWallet = walletsWithBalances.find(w => w.blockchain === 'Solana');
      const existingEthWallet = walletsWithBalances.find(w => w.blockchain === 'Ethereum');
      
      // If missing wallets and we have other wallets, create entries in the database
      if ((!existingSolWallet || !hasBtcTaproot || !hasBtcSegwit) && existingEthWallet) {
        try {
          console.log("Creating missing wallets");
          // Call create-wallets edge function to generate proper wallets
          const { data: createWalletsResponse, error: createError } = await supabase.functions.invoke('create-wallets', {
            method: 'POST',
            body: { userId }
          });
          
          if (createError) {
            console.error("Error creating wallets:", createError);
          } else {
            console.log("Wallet creation response:", createWalletsResponse);
            
            // Refresh wallet data after creation
            const { data: freshWallets } = await supabase
              .from('wallets')
              .select('blockchain, currency, address, balance, wallet_type')
              .eq('user_id', userId);
            
            if (freshWallets && freshWallets.length > 0) {
              // Add the newly created wallets
              freshWallets.forEach(wallet => {
                if (!walletsWithBalances.some(w => 
                  w.blockchain === wallet.blockchain && 
                  w.currency === wallet.currency &&
                  w.wallet_type === wallet.wallet_type
                )) {
                  walletsWithBalances.push({
                    ...wallet,
                    balance: parseFloat(wallet.balance as any) || 0
                  });
                }
              });
              
              console.log(`Added ${freshWallets.length} wallets to response`);
            }
          }
        } catch (err) {
          console.error("Error in wallet creation process:", err);
        }
      }
    }

    console.log(`Returning ${walletsWithBalances.length} wallets with balances`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wallet balances fetched successfully',
        wallets: walletsWithBalances
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
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
