
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

// Main cryptocurrencies to focus on - updated to include all supported chains
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
      }
      
      return {
        success: true,
        message: "No wallets found for user",
        wallets: []
      };
    }
    
    console.log(`Found ${wallets.length} wallets for user ${userId}`);
    
    // Filter wallets to only include main cryptocurrencies (not tokens like USDT)
    const filteredWallets = wallets.filter(wallet => {
      // Include wallets that are main cryptocurrencies or imported
      return MAIN_CURRENCIES.includes(wallet.currency) || wallet.wallet_type === 'imported';
    });
    
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
      }))
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
