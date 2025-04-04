
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // Check if user exists
    const { data: userExists, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userExists) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Sample wallet generation (for security, actual wallet private keys would be handled more securely)
    const wallets = [
      {
        user_id: userId,
        blockchain: "Solana",
        currency: "SOL",
        address: `sol${Math.random().toString(36).substring(2, 15)}`,
        balance: 0,
        wallet_type: "Default"
      },
      {
        user_id: userId,
        blockchain: "Ethereum",
        currency: "ETH",
        address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: 0,
        wallet_type: "Default"
      },
      {
        user_id: userId,
        blockchain: "Monad",
        currency: "MONAD",
        address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: 0,
        wallet_type: "Testnet"
      },
      {
        user_id: userId,
        blockchain: "Base",
        currency: "ETH",
        address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: 0,
        wallet_type: "Default"
      },
      {
        user_id: userId,
        blockchain: "Sui",
        currency: "SUI",
        address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: 0,
        wallet_type: "Default"
      },
      {
        user_id: userId,
        blockchain: "Polygon",
        currency: "MATIC",
        address: `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        balance: 0,
        wallet_type: "Default"
      },
      {
        user_id: userId,
        blockchain: "Bitcoin",
        currency: "BTC",
        address: `bc1${Math.random().toString(36).substring(2, 15)}`,
        balance: 0,
        wallet_type: "Taproot"
      },
      {
        user_id: userId,
        blockchain: "Bitcoin",
        currency: "BTC",
        address: `bc1${Math.random().toString(36).substring(2, 15)}`,
        balance: 0,
        wallet_type: "Native SegWit"
      },
    ];

    // Insert wallets into database
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert(wallets);

    if (walletError) {
      console.error("Error creating wallets:", walletError);
      return new Response(
        JSON.stringify({ error: "Failed to create wallets", details: walletError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Wallets created successfully",
        walletCount: wallets.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error occurred", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
