
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as bitcoinjs from "https://esm.sh/bitcoinjs-lib@6.1.5";
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { decode as base58_decode, encode as base58_encode } from "https://esm.sh/bs58@5.0.0";
import * as solanaWeb3 from "https://esm.sh/@solana/web3.js@1.91.1";

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

// Function to create a Solana wallet
function createSolanaWallet() {
  try {
    const keypair = solanaWeb3.Keypair.generate();
    return {
      address: keypair.publicKey.toString(),
      private_key: Buffer.from(keypair.secretKey).toString('hex'),
    };
  } catch (error) {
    console.error("Error creating Solana wallet:", error);
    throw new Error(`Failed to create Solana wallet: ${error.message}`);
  }
}

// Function to create a Tron wallet using Ethereum wallet method
// Tron addresses are derived from Ethereum-style private keys but with a different address format
function createTronWallet() {
  try {
    // Create an Ethereum wallet first
    const ethWallet = ethers.Wallet.createRandom();
    
    // Convert Ethereum address to Tron address format
    // Tron addresses start with 'T' instead of '0x'
    // In a real implementation, you would use a TronWeb library
    // For this simplified version, we'll use a placeholder conversion
    const ethAddressHex = ethWallet.address.slice(2); // Remove '0x'
    const tronAddress = `T${ethAddressHex}`; // Simplified - in reality would use proper conversion
    
    return {
      address: tronAddress,
      private_key: ethWallet.privateKey,
    };
  } catch (error) {
    console.error("Error creating Tron wallet:", error);
    throw new Error(`Failed to create Tron wallet: ${error.message}`);
  }
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
        balance: 0.05, // Add sample balance for testing
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
        balance: 1.2, // Add sample balance for testing
      });
      
      // Also create USDT wallet on Ethereum with the same address
      wallets.push({
        user_id: userId,
        blockchain: "Ethereum",
        currency: "USDT",
        address: ethWallet.address,
        private_key: ethWallet.privateKey, // Should be encrypted in production
        wallet_type: "token",
        balance: 150, // Add sample balance for testing
      });
      console.log("Created ETH and USDT wallets");
    } catch (ethError) {
      console.error("Error creating ETH wallet:", ethError);
    }

    // 3. Create Solana wallet
    try {
      const solWallet = createSolanaWallet();
      wallets.push({
        user_id: userId,
        blockchain: "Solana",
        currency: "SOL",
        address: solWallet.address,
        private_key: solWallet.private_key,
        wallet_type: "imported",
        balance: 2.5, // Add sample balance for testing
      });
      console.log("Created SOL wallet");
    } catch (solError) {
      console.error("Error creating SOL wallet:", solError);
    }

    // 4. Create Tron wallet
    try {
      const tronWallet = createTronWallet();
      wallets.push({
        user_id: userId,
        blockchain: "Tron",
        currency: "TRX",
        address: tronWallet.address,
        private_key: tronWallet.private_key,
        wallet_type: "imported",
        balance: 100, // Add sample balance for testing
      });
      console.log("Created TRX wallet");
    } catch (tronError) {
      console.error("Error creating TRX wallet:", tronError);
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

    // Get user ID from request
    const userId = requestData.userId;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "No userId provided" }), {
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
