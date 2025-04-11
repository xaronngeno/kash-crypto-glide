
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';
import { createInitialWallets, createMissingWallets } from './wallet-creator.ts';

// Fetch all wallets for a specific user
async function fetchUserWallets(supabase: any, userId: string) {
  console.log(`Fetching wallets for user ${userId}`);

  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('blockchain, currency, address, balance, wallet_type')
    .eq('user_id', userId);
  
  if (walletsError) {
    console.error('Error fetching wallets:', walletsError.message);
    throw walletsError;
  }

  console.log(`Found ${wallets?.length || 0} wallets for user ${userId}`);
  return wallets;
}

// Process wallets to ensure consistent balance format
function processWalletBalances(wallets) {
  return wallets.map(wallet => ({
    ...wallet,
    balance: parseFloat(wallet.balance as any) || 0
  }));
}

// Check if user has specific wallet types
function checkWalletTypes(wallets) {
  const hasSol = wallets.some(w => w.currency === 'SOL' && w.blockchain === 'Solana');
  const hasUsdtSol = wallets.some(w => w.currency === 'USDT' && w.blockchain === 'Solana');
  const hasBtcSegwit = wallets.some(w => w.currency === 'BTC' && w.blockchain === 'Bitcoin' && w.wallet_type === 'Native SegWit');
  
  console.log(`Has SOL wallet: ${hasSol}, Has USDT on Solana: ${hasUsdtSol}`);
  console.log(`Has BTC SegWit: ${hasBtcSegwit}`);
  
  return { hasSol, hasUsdtSol, hasBtcSegwit };
}

// Remove any Taproot wallets (if present)
function filterTaprootWallets(wallets) {
  return wallets.filter(w => 
    !(w.currency === 'BTC' && w.blockchain === 'Bitcoin' && w.wallet_type === 'Taproot')
  );
}

// Main handler
serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user ID from request
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch user wallets
    let wallets;
    try {
      wallets = await fetchUserWallets(supabase, userId);
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Failed to fetch wallets',
          wallets: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Create wallets if none exist
    if (!wallets || wallets.length === 0) {
      try {
        const newWallets = await createInitialWallets(supabase, userId);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Wallets created successfully',
            wallets: newWallets || []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (createError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Failed to create wallets',
            error: createError instanceof Error ? createError.message : 'Unknown error',
            wallets: []
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Process wallet balances
    const walletsWithBalances = processWalletBalances(wallets);
    
    // Check wallet types
    const { hasSol, hasUsdtSol, hasBtcSegwit } = checkWalletTypes(walletsWithBalances);
    
    // Filter out Taproot wallets
    const noTaprootWallets = filterTaprootWallets(walletsWithBalances);
    
    // Create any missing wallets if needed
    if (!hasSol || !hasUsdtSol || !hasBtcSegwit) {
      const addedWallets = await createMissingWallets(
        supabase, 
        userId, 
        hasSol, 
        hasUsdtSol, 
        hasBtcSegwit
      );
      
      // Add any newly created wallets to the results
      addedWallets.forEach(wallet => {
        noTaprootWallets.push(wallet);
      });
    }

    console.log(`Returning ${noTaprootWallets.length} wallets with balances`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wallet balances fetched successfully',
        wallets: noTaprootWallets
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    
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
