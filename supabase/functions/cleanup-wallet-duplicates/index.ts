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

    const { userId } = requestData;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 1: Fetch all wallets for the user
    const { data: userWallets, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId);
    
    if (fetchError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to fetch user wallets: ${fetchError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Step 2: Group wallets by blockchain and currency
    const walletGroups = new Map();
    
    userWallets.forEach(wallet => {
      const key = `${wallet.blockchain}-${wallet.currency}`;
      
      if (!walletGroups.has(key)) {
        walletGroups.set(key, []);
      }
      
      walletGroups.get(key).push(wallet);
    });
    
    // Step 3: For each group, keep only the wallet with the most recent updated_at
    const walletsToDelete = [];
    const walletsToKeep = [];
    
    walletGroups.forEach((wallets, key) => {
      if (wallets.length > 1) {
        // Sort by updated_at date in descending order (newest first)
        const sortedWallets = wallets.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
        
        // Keep the first one (newest) and mark the rest for deletion
        walletsToKeep.push(sortedWallets[0]);
        
        for (let i = 1; i < sortedWallets.length; i++) {
          walletsToDelete.push(sortedWallets[i].id);
        }
      } else if (wallets.length === 1) {
        // If only one wallet of this type, keep it
        walletsToKeep.push(wallets[0]);
      }
    });

    console.log(`Found ${walletsToDelete.length} duplicate wallets to delete out of ${userWallets.length} total wallets`);
    
    // Step 4: Delete the duplicates
    let deleteResult = null;
    if (walletsToDelete.length > 0) {
      const { data, error: deleteError } = await supabase
        .from('wallets')
        .delete()
        .in('id', walletsToDelete)
        .select();
        
      if (deleteError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Failed to delete duplicate wallets: ${deleteError.message}`,
            deletionAttempted: true,
            walletsFound: userWallets.length,
            duplicatesFound: walletsToDelete.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      deleteResult = {
        deleted: walletsToDelete.length,
        kept: walletsToKeep.length
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed wallets. ${walletsToDelete.length} duplicates removed.`,
        result: deleteResult,
        walletsFound: userWallets.length,
        duplicatesRemoved: walletsToDelete.length,
        walletsRemaining: walletsToKeep.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error cleaning up wallet duplicates:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error cleaning up wallet duplicates',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
