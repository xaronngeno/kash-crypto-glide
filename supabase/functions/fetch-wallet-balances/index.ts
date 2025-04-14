import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from '../_shared/cors.ts';
import { createInitialWallets, createMissingWallets } from './wallet-creator.ts';

let activeOperations = 0;
let isShuttingDown = false;

addEventListener('beforeunload', (ev) => {
  const reason = ev.detail?.reason || 'unknown reason';
  console.log(`Function shutdown initiated due to: ${reason}`);
  isShuttingDown = true;
  
  console.log(`Shutdown with ${activeOperations} active operations`);
});

function trackOperation<T>(operation: Promise<T>): Promise<T> {
  activeOperations++;
  
  return operation
    .finally(() => {
      activeOperations--;
      if (activeOperations < 0) activeOperations = 0;
    });
}

async function fetchUserWallets(supabase: any, userId: string) {
  console.log(`Fetching wallets for user ${userId}`);

  const { data: wallets, error: walletsError } = await supabase
    .from('wallets')
    .select('blockchain, currency, address, balance, wallet_type, updated_at')
    .eq('user_id', userId);
  
  if (walletsError) {
    console.error('Error fetching wallets:', walletsError.message);
    throw walletsError;
  }

  const walletsCount = wallets?.length || 0;
  console.log(`Found ${walletsCount} wallets for user ${userId}`);
  
  if (wallets && wallets.length > 0) {
    const bitcoinWallets = wallets.filter(w => w.blockchain === 'Bitcoin');
    const ethereumWallets = wallets.filter(w => w.blockchain === 'Ethereum');
    const solanaWallets = wallets.filter(w => w.blockchain === 'Solana');
    
    console.log(`Wallet breakdown - BTC: ${bitcoinWallets.length}, ETH: ${ethereumWallets.length}, SOL: ${solanaWallets.length}`);
    
    if (bitcoinWallets.length > 0) {
      console.log(`Bitcoin addresses:`, bitcoinWallets.map(w => w.address));
    }
    if (ethereumWallets.length > 0) {
      console.log(`Ethereum addresses:`, ethereumWallets.map(w => w.address));
    }
    if (solanaWallets.length > 0) {
      console.log(`Solana addresses:`, solanaWallets.map(w => w.address));
    }
  }
  
  return wallets;
}

function filterNativeWallets(wallets: any[]) {
  if (!wallets || wallets.length === 0) return [];
  
  const nativeWallets = wallets.filter(wallet => (
    (wallet.blockchain === 'Ethereum' && wallet.currency === 'ETH') ||
    (wallet.blockchain === 'Solana' && wallet.currency === 'SOL') ||
    (wallet.blockchain === 'Bitcoin' && wallet.currency === 'BTC' && wallet.wallet_type === 'Native SegWit')
  ));
  
  console.log(`Filtered ${wallets.length} wallets down to ${nativeWallets.length} native wallets`);
  return nativeWallets;
}

function deduplicateWallets(wallets: any[]) {
  const uniqueWalletsMap = new Map<string, any>();
  
  for (const wallet of wallets) {
    const walletKey = `${wallet.blockchain}-${wallet.currency}-${wallet.wallet_type}`;
    
    if (!uniqueWalletsMap.has(walletKey) || 
        (wallet.updated_at && uniqueWalletsMap.get(walletKey).updated_at && 
         new Date(wallet.updated_at) > new Date(uniqueWalletsMap.get(walletKey).updated_at))) {
      uniqueWalletsMap.set(walletKey, wallet);
    }
  }
  
  return Array.from(uniqueWalletsMap.values());
}

function processWalletBalances(wallets) {
  const dedupedWallets = deduplicateWallets(wallets);
  console.log(`Deduplicated ${wallets.length} wallets to ${dedupedWallets.length} unique wallets`);
  
  return dedupedWallets.map(wallet => ({
    ...wallet,
    balance: parseFloat(wallet.balance as any) || 0
  }));
}

function checkWalletTypes(wallets) {
  const hasSol = wallets.some(w => w.currency === 'SOL' && w.blockchain === 'Solana');
  const hasEth = wallets.some(w => w.currency === 'ETH' && w.blockchain === 'Ethereum');
  const hasBtcSegwit = wallets.some(w => w.currency === 'BTC' && w.blockchain === 'Bitcoin' && w.wallet_type === 'Native SegWit');
  
  console.log(`Has SOL wallet: ${hasSol}`);
  console.log(`Has ETH wallet: ${hasEth}`);
  console.log(`Has BTC SegWit: ${hasBtcSegwit}`);
  
  return { hasSol, hasEth, hasBtcSegwit };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    let requestData;
    try {
      requestData = await req.json();
    } catch (jsonError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { userId, forceRefresh = false } = requestData;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (isShuttingDown) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Server is shutting down, please retry your request',
          retryable: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
      );
    }

    let wallets;
    try {
      wallets = await trackOperation(fetchUserWallets(supabase, userId));
      
      wallets = filterNativeWallets(wallets);
      console.log(`After filtering to native wallets: ${wallets?.length || 0} wallets`);
      
      wallets = deduplicateWallets(wallets);
      console.log(`After deduplication: ${wallets?.length || 0} wallets`);
      
      if (forceRefresh && wallets && wallets.length > 0) {
        console.log("Force refresh requested, checking blockchain explorers");
        
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
          EdgeRuntime.waitUntil((async () => {
            try {
              console.log("Background task: Processing blockchain explorer data");
              const solanaAddresses = wallets.filter(w => w.blockchain === 'Solana').map(w => w.address);
              if (solanaAddresses.length > 0) {
                console.log("Would check Solana balances for:", solanaAddresses);
              }
              
              const ethereumAddresses = wallets.filter(w => w.blockchain === 'Ethereum').map(w => w.address);
              if (ethereumAddresses.length > 0) {
                console.log("Would check Ethereum balances for:", ethereumAddresses);
              }
              
              const bitcoinAddresses = wallets.filter(w => w.blockchain === 'Bitcoin').map(w => w.address);
              if (bitcoinAddresses.length > 0) {
                console.log("Would check Bitcoin balances for:", bitcoinAddresses);
              }
              
              console.log("Background task completed successfully");
            } catch (err) {
              console.error("Error in background task:", err);
            }
          })());
        }
      }
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

    if (!wallets || wallets.length === 0) {
      try {
        const newWallets = await trackOperation(createInitialWallets(supabase, userId));
        
        const filteredNewWallets = filterNativeWallets(newWallets);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Wallets created successfully',
            wallets: filteredNewWallets || []
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

    const walletsWithBalances = processWalletBalances(wallets);
    
    const { hasSol, hasEth, hasBtcSegwit } = checkWalletTypes(walletsWithBalances);
    
    const missingWallets = [];
    if (!hasSol || !hasEth || !hasBtcSegwit) {
      try {
        const createMissingWalletsPromise = createMissingWallets(
          supabase, 
          userId, 
          hasSol, 
          hasEth,
          hasBtcSegwit
        );
        
        if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
          EdgeRuntime.waitUntil((async () => {
            try {
              console.log("Background task: Creating missing wallets");
              const addedWallets = await createMissingWalletsPromise;
              console.log(`Created ${addedWallets.length} missing wallets in the background`);
            } catch (err) {
              console.error("Error creating missing wallets in background:", err);
            }
          })());
        } else {
          const addedWallets = await trackOperation(createMissingWalletsPromise);
          console.log(`Created ${addedWallets.length} missing wallets`);
          
          const dedupedAddedWallets = deduplicateWallets(addedWallets);
          
          dedupedAddedWallets.forEach(wallet => {
            walletsWithBalances.push(wallet);
          });
          missingWallets.push(...dedupedAddedWallets);
        }
      } catch (err) {
        console.error("Error handling missing wallet creation:", err);
      }
    }

    console.log(`Returning ${walletsWithBalances.length} wallets with balances`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Wallet balances fetched successfully',
        wallets: walletsWithBalances,
        missingWallets: missingWallets,
        refreshed: forceRefresh
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error processing wallet data',
        wallets: [],
        error: error.message || 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
