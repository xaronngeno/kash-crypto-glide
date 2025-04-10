
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as bitcoinjs from "https://esm.sh/bitcoinjs-lib@6.1.5";
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { decode as base58_decode, encode as base58_encode } from "https://esm.sh/bs58@5.0.0";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Function to handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
}

// Create wallet addresses for a user
async function createUserWallets(supabase: any, userId: string) {
  try {
    console.log(`Creating wallets for user: ${userId}`);
    
    // Check if user already has wallets
    const { data: existingWallets, error: checkError } = await supabase
      .from("wallets")
      .select("currency")
      .eq("user_id", userId);

    if (checkError) {
      throw new Error(`Error checking existing wallets: ${checkError.message}`);
    }

    if (existingWallets && existingWallets.length > 0) {
      console.log(`User ${userId} already has ${existingWallets.length} wallets`);
      return { success: true, message: "Wallets already exist", wallets: existingWallets };
    }

    // Create wallet objects to insert
    const wallets = [];

    // 1. Create Bitcoin wallet
    try {
      const network = bitcoinjs.networks.bitcoin;
      const keyPair = bitcoinjs.ECPair.makeRandom({ network });
      const { address } = bitcoinjs.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network,
      });
      
      // Get WIF private key
      const privateKey = keyPair.toWIF();
      
      wallets.push({
        user_id: userId,
        blockchain: "Bitcoin",
        currency: "BTC",
        address: address,
        private_key: privateKey, // Should be encrypted in production
        wallet_type: "imported",
      });
      console.log("Created BTC wallet");
    } catch (btcError) {
      console.error("Error creating BTC wallet:", btcError);
    }

    // 2. Create Ethereum wallet
    try {
      const ethWallet = ethers.Wallet.createRandom();
      wallets.push({
        user_id: userId,
        blockchain: "Ethereum",
        currency: "ETH",
        address: ethWallet.address,
        private_key: ethWallet.privateKey, // Should be encrypted in production
        wallet_type: "imported",
      });
      
      // Also create USDT wallet on Ethereum with the same address
      wallets.push({
        user_id: userId,
        blockchain: "Ethereum",
        currency: "USDT",
        address: ethWallet.address,
        private_key: ethWallet.privateKey, // Should be encrypted in production
        wallet_type: "token",
      });
      console.log("Created ETH and USDT wallets");
    } catch (ethError) {
      console.error("Error creating ETH wallet:", ethError);
    }

    // Insert wallets into database
    if (wallets.length > 0) {
      const { data: insertedWallets, error: insertError } = await supabase
        .from("wallets")
        .insert(wallets)
        .select();

      if (insertError) {
        throw new Error(`Error inserting wallets: ${insertError.message}`);
      }

      return { success: true, message: "Wallets created successfully", wallets: insertedWallets };
    } else {
      throw new Error("No wallets were created");
    }

  } catch (error) {
    console.error("Error in createUserWallets function:", error);
    return { success: false, error: error.message };
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

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    let userId: string;

    // Check if this is a POST request and has a body
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 405,
      });
    }

    // Parse the request body safely
    let requestData;
    try {
      const text = await req.text();
      // Only try to parse if there's actually content
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

    // Get user ID from request or auth header
    if (requestData && requestData.userId) {
      userId = requestData.userId;
    } else if (authHeader && authHeader.startsWith("Bearer ")) {
      // Get JWT from auth header
      const token = authHeader.replace("Bearer ", "");
      
      // Verify the JWT and get user information
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        throw new Error(`Auth error: ${authError?.message || "User not found"}`);
      }
      
      userId = user.id;
    } else {
      return new Response(JSON.stringify({ error: "No authorization or userId provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create wallets for the user
    const result = await createUserWallets(supabase, userId);

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
