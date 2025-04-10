
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

// Simple encryption function - in production, use a more secure method and proper key management
function encryptPrivateKey(privateKey: string, userId: string): string {
  try {
    // This is a VERY simple encryption method for demonstration
    // In production, use a proper encryption library and secure key management
    // Example: AES encryption with a proper key derivation function
    
    // Create a simple XOR encryption with user ID as part of the key
    // DO NOT USE THIS IN PRODUCTION - it's not secure!
    const encryptionKey = `KASH_SECRET_KEY_${userId}_SECURE`;
    let encrypted = "";
    
    for (let i = 0; i < privateKey.length; i++) {
      const keyChar = encryptionKey[i % encryptionKey.length].charCodeAt(0);
      const plainChar = privateKey[i].charCodeAt(0);
      encrypted += String.fromCharCode(plainChar ^ keyChar);
    }
    
    // Convert to base64 for storage
    return btoa(encrypted);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt private key");
  }
}

// Function to create a Solana wallet
function createSolanaWallet(userId: string) {
  try {
    const keypair = solanaWeb3.Keypair.generate();
    const privateKeyHex = Buffer.from(keypair.secretKey).toString('hex');
    
    return {
      address: keypair.publicKey.toString(),
      private_key: encryptPrivateKey(privateKeyHex, userId),
    };
  } catch (error) {
    console.error("Error creating Solana wallet:", error);
    throw new Error(`Failed to create Solana wallet: ${error.message}`);
  }
}

// Function to create a Tron wallet using Ethereum wallet method
// Tron addresses are derived from Ethereum-style private keys but with a different address format
function createTronWallet(userId: string) {
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
      private_key: encryptPrivateKey(ethWallet.privateKey, userId),
    };
  } catch (error) {
    console.error("Error creating Tron wallet:", error);
    throw new Error(`Failed to create Tron wallet: ${error.message}`);
  }
}

// Function to create a Bitcoin wallet
function createBitcoinWallet(userId: string) {
  try {
    const network = bitcoinjs.networks.bitcoin;
    const keyPair = bitcoinjs.ECPair.makeRandom({ network });
    const { address } = bitcoinjs.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network,
    });
    
    const privateKey = keyPair.toWIF();
    
    return {
      address: address,
      private_key: encryptPrivateKey(privateKey, userId),
    };
  } catch (error) {
    console.error("Error creating BTC wallet:", error);
    throw new Error(`Failed to create BTC wallet: ${error.message}`);
  }
}

// Function to create a standard EVM wallet (Ethereum, BSC, etc.)
function createEVMWallet(blockchain: string, currency: string, userId: string) {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      blockchain,
      currency,
      address: wallet.address,
      private_key: encryptPrivateKey(wallet.privateKey, userId),
    };
  } catch (error) {
    console.error(`Error creating ${blockchain} wallet:`, error);
    throw new Error(`Failed to create ${blockchain} wallet: ${error.message}`);
  }
}

// Create wallet addresses for a user
async function createUserWallets(supabase: any, userId: string) {
  try {
    console.log(`Creating wallets for user: ${userId}`);
    
    // Get user profile to check numeric ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("numeric_id")
      .eq("id", userId)
      .single();
      
    if (profileError) {
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }
    
    if (!profile || !profile.numeric_id) {
      // Assign a numeric ID if not already present
      console.log("User doesn't have a numeric ID yet, generating one");
      let numeric_id;
      let idUnique = false;
      
      // Try up to 10 times to generate a unique ID
      for (let attempts = 0; attempts < 10 && !idUnique; attempts++) {
        numeric_id = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
        
        // Check if this ID already exists
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('numeric_id', numeric_id);
        
        if (!countError && count === 0) {
          idUnique = true;
        }
      }
      
      if (!idUnique) {
        throw new Error("Could not generate a unique numeric ID");
      }
      
      // Update the profile with the new numeric ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ numeric_id })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(`Error updating user's numeric ID: ${updateError.message}`);
      }
      
      console.log(`Assigned numeric ID ${numeric_id} to user ${userId}`);
    }
    
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
      const btcWallet = createBitcoinWallet(userId);
      wallets.push({
        user_id: userId,
        blockchain: "Bitcoin",
        currency: "BTC",
        address: btcWallet.address,
        private_key: btcWallet.private_key,
        wallet_type: "imported",
        balance: 0, // Start with zero balance
      });
      console.log("Created BTC wallet");
    } catch (btcError) {
      console.error("Error creating BTC wallet:", btcError);
    }

    // 2. Create Ethereum wallet
    try {
      const ethWallet = createEVMWallet("Ethereum", "ETH", userId);
      wallets.push({
        user_id: userId,
        blockchain: ethWallet.blockchain,
        currency: ethWallet.currency,
        address: ethWallet.address,
        private_key: ethWallet.private_key,
        wallet_type: "imported",
        balance: 0,
      });
      
      // Also create USDT wallet on Ethereum with the same address
      // For USDT, we need to track which network it's on
      wallets.push({
        user_id: userId,
        blockchain: "Ethereum",
        currency: "USDT",
        address: ethWallet.address,
        private_key: ethWallet.private_key,
        wallet_type: "token",
        balance: 0,
      });
      console.log("Created ETH and USDT (ERC20) wallets");
    } catch (ethError) {
      console.error("Error creating ETH wallet:", ethError);
    }

    // 3. Create Solana wallet
    try {
      const solWallet = createSolanaWallet(userId);
      wallets.push({
        user_id: userId,
        blockchain: "Solana",
        currency: "SOL",
        address: solWallet.address,
        private_key: solWallet.private_key,
        wallet_type: "imported",
        balance: 0,
      });
      
      // Add USDT on Solana (SPL token)
      wallets.push({
        user_id: userId,
        blockchain: "Solana",
        currency: "USDT",
        address: solWallet.address,
        private_key: solWallet.private_key,
        wallet_type: "token",
        balance: 0,
      });
      console.log("Created SOL wallet and USDT (SPL) wallet");
    } catch (solError) {
      console.error("Error creating SOL wallet:", solError);
    }

    // 4. Create Tron wallet
    try {
      const tronWallet = createTronWallet(userId);
      wallets.push({
        user_id: userId,
        blockchain: "Tron",
        currency: "TRX",
        address: tronWallet.address,
        private_key: tronWallet.private_key,
        wallet_type: "imported",
        balance: 0,
      });
      
      // Add USDT on Tron (TRC20)
      wallets.push({
        user_id: userId,
        blockchain: "Tron",
        currency: "USDT",
        address: tronWallet.address,
        private_key: tronWallet.private_key,
        wallet_type: "token",
        balance: 0,
      });
      console.log("Created TRX wallet and USDT (TRC20) wallet");
    } catch (tronError) {
      console.error("Error creating TRX wallet:", tronError);
    }

    // 5. Create additional EVM-compatible wallets
    try {
      // Binance Smart Chain (BSC)
      const bscWallet = createEVMWallet("Binance Smart Chain", "BNB", userId);
      wallets.push({
        user_id: userId,
        blockchain: bscWallet.blockchain,
        currency: bscWallet.currency,
        address: bscWallet.address,
        private_key: bscWallet.private_key,
        wallet_type: "imported",
        balance: 0,
      });
      
      // Add USDT on BSC (BEP20)
      wallets.push({
        user_id: userId,
        blockchain: "Binance Smart Chain",
        currency: "USDT",
        address: bscWallet.address,
        private_key: bscWallet.private_key,
        wallet_type: "token",
        balance: 0,
      });
      
      // Polygon
      const polygonWallet = createEVMWallet("Polygon", "MATIC", userId);
      wallets.push({
        user_id: userId,
        blockchain: polygonWallet.blockchain,
        currency: polygonWallet.currency,
        address: polygonWallet.address,
        private_key: polygonWallet.private_key,
        wallet_type: "imported",
        balance: 0,
      });
      
      // Add USDT on Polygon
      wallets.push({
        user_id: userId,
        blockchain: "Polygon",
        currency: "USDT",
        address: polygonWallet.address,
        private_key: polygonWallet.private_key,
        wallet_type: "token",
        balance: 0,
      });
      
      console.log("Created additional EVM wallets and USDT tokens");
    } catch (evmError) {
      console.error("Error creating additional EVM wallets:", evmError);
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

      return { success: true, message: "Wallets created successfully", count: wallets.length, wallets: insertedWallets };
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
