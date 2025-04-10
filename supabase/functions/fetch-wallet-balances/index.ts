
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
}

// Include ALL supported cryptocurrencies - making sure TRX and SOL are included
const MAIN_CURRENCIES = ['BTC', 'ETH', 'SOL', 'MONAD', 'TRX', 'SUI'];

// Fetch real wallet balances for a user from the database
async function fetchWalletBalances(supabase: any, userId: string) {
  try {
    console.log(`Fetching wallet balances for user: ${userId}`);
    
    // Fetch all wallets for the user including mnemonic phrases
    const { data: wallets, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId);
    
    if (error) {
      throw new Error(`Error fetching wallets: ${error.message}`);
    }
    
    console.log(`Raw wallets data:`, wallets);
    console.log(`Wallet currencies found:`, wallets.map(w => `${w.currency} on ${w.blockchain}`).join(', '));
    
    if (!wallets || wallets.length === 0) {
      console.log(`No wallets found for user ${userId}. Checking if we should create them.`);
      
      // Check for stored mnemonic
      const { data: mnemonicData, error: mnemonicError } = await supabase
        .from("user_mnemonics")
        .select("main_mnemonic")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (mnemonicError) {
        console.error("Error checking for mnemonic:", mnemonicError);
      } else if (mnemonicData?.main_mnemonic) {
        console.log("User has mnemonic but no wallets. This is inconsistent.");
        
        // Try to create wallets since we have a mnemonic
        console.log("Attempting to create wallets for user with existing mnemonic");
        try {
          // We'll let the client handle wallet creation since it has all the logic
          return {
            success: true,
            message: "No wallets found for user, but mnemonic exists",
            wallets: [],
            shouldCreateWallets: true
          };
        } catch (createError) {
          console.error("Error creating wallets:", createError);
        }
      }
      
      return {
        success: true,
        message: "No wallets found for user",
        wallets: []
      };
    }
    
    console.log(`Found ${wallets.length} wallets for user ${userId}`);
    console.log("Wallet currencies:", wallets.map(w => w.currency));
    
    // Filter wallets to only include main cryptocurrencies and imported wallets
    const filteredWallets = wallets.filter(wallet => {
      const isMainCurrency = MAIN_CURRENCIES.includes(wallet.currency);
      const isImported = wallet.wallet_type === 'imported';
      
      if (!isMainCurrency && !isImported) {
        console.log(`Filtering out non-main currency: ${wallet.currency}`);
      }
      
      return isMainCurrency || isImported;
    });
    
    console.log(`After filtering, returning ${filteredWallets.length} wallets`);
    console.log("Filtered wallet data:", filteredWallets);
    
    // Return the filtered wallet data with balance information
    return {
      success: true,
      message: "Wallet balances retrieved successfully",
      wallets: filteredWallets.map(wallet => ({
        blockchain: wallet.blockchain,
        currency: wallet.currency,
        address: wallet.address,
        balance: wallet.balance || 0,
        wallet_type: wallet.wallet_type
      })),
      debug: {
        allWallets: wallets.map(w => ({
          blockchain: w.blockchain,
          currency: w.currency
        })),
        mainCurrencies: MAIN_CURRENCIES
      }
    };
    
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the request body
    let requestData;
    try {
      const text = await req.text();
      if (text && text.trim()) {
        requestData = JSON.parse(text);
      } else {
        requestData = {};
      }
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get user ID from request
    const userId = requestData.userId;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "No userId provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Fetch wallet balances for the user
    const result = await fetchWalletBalances(supabase, userId);

    // Return the result
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: result.success ? 200 : 400,
    });
    
  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
