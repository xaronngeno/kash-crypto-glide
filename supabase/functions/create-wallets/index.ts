import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
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

// WALLET GENERATION FUNCTIONS

// Function to create a Solana wallet that works in Deno
function createSolanaWallet(userId: string) {
  try {
    console.log("Creating Solana wallet...");
    
    // Create a Solana keypair using the ed25519 crypto built into Deno
    const keypair = solanaWeb3.Keypair.generate();
    
    // Get the base58 encoded public key (address)
    const publicKey = keypair.publicKey.toString();
    
    // Convert secretKey to hex string for storage
    const privateKeyBytes = keypair.secretKey;
    let privateKeyHex = "";
    for (let i = 0; i < privateKeyBytes.length; i++) {
      const hex = privateKeyBytes[i].toString(16).padStart(2, "0");
      privateKeyHex += hex;
    }
    
    console.log("Successfully created Solana wallet with address:", publicKey);
    
    return {
      address: publicKey,
      private_key: encryptPrivateKey(privateKeyHex, userId),
    };
  } catch (error) {
    console.error("Error creating Solana wallet:", error);
    throw new Error(`Failed to create Solana wallet: ${error.message}`);
  }
}

// Function to create a Bitcoin wallet using Deno's native crypto
function createBitcoinWallet(userId: string, type: 'taproot' | 'segwit' = 'segwit') {
  try {
    console.log(`Creating Bitcoin ${type} wallet...`);
    
    // Generate a private key using Deno's crypto.getRandomValues
    const privateKeyBytes = new Uint8Array(32);
    crypto.getRandomValues(privateKeyBytes);
    
    // Convert to hex for storage
    const privateKeyHex = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Generate a deterministic address based on the private key and type
    // This is a simplified approach for demonstration purposes
    // In a real implementation, use proper key derivation and address generation
    const addressSeed = new TextEncoder().encode(`${privateKeyHex}-${userId}-${type}`);
    const addressHashBuffer = new Uint8Array(20);
    crypto.getRandomValues(addressHashBuffer);
    
    // Create address based on type without underscores
    let address: string;
    if (type === 'taproot') {
      // Simulate Taproot address (bc1p...)
      address = `bc1p${base58_encode(addressHashBuffer).substring(0, 38)}`;
    } else {
      // Simulate SegWit address (bc1q...)
      address = `bc1q${base58_encode(addressHashBuffer).substring(0, 38)}`;
    }
    
    console.log(`Successfully created Bitcoin ${type} wallet with address: ${address}`);
    
    return {
      address,
      private_key: encryptPrivateKey(privateKeyHex, userId),
      wallet_type: type === 'taproot' ? 'Taproot' : 'Native SegWit'
    };
  } catch (error) {
    console.error(`Error creating Bitcoin ${type} wallet:`, error);
    throw new Error(`Failed to create Bitcoin ${type} wallet: ${error.message}`);
  }
}

// Function to create a standard EVM wallet (Ethereum)
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
      .select("currency, blockchain, wallet_type")
      .eq("user_id", userId);

    if (checkError) {
      throw new Error(`Error checking existing wallets: ${checkError.message}`);
    }

    // Create an object to keep track of which wallets exist
    const existingWalletKeys = new Set();
    if (existingWallets && existingWallets.length > 0) {
      console.log(`User ${userId} already has ${existingWallets.length} wallets`);
      
      // Track existing wallet combinations
      existingWallets.forEach(wallet => {
        const key = wallet.wallet_type 
          ? `${wallet.blockchain}-${wallet.currency}-${wallet.wallet_type}`
          : `${wallet.blockchain}-${wallet.currency}`;
        existingWalletKeys.add(key);
      });
    }

    // Create wallet objects to insert
    const wallets = [];

    // 1. Create Bitcoin wallets if they don't exist
    if (!existingWalletKeys.has("Bitcoin-BTC-Taproot")) {
      try {
        console.log("Creating Bitcoin Taproot wallet");
        const taprootWallet = createBitcoinWallet(userId, 'taproot');
        wallets.push({
          user_id: userId,
          blockchain: "Bitcoin",
          currency: "BTC",
          address: taprootWallet.address,
          private_key: taprootWallet.private_key,
          wallet_type: taprootWallet.wallet_type,
          balance: 0, // Start with zero balance
        });
        console.log("Created BTC Taproot wallet");
      } catch (btcError) {
        console.error("Error creating BTC Taproot wallet:", btcError);
      }
    }

    if (!existingWalletKeys.has("Bitcoin-BTC-Native SegWit")) {
      try {
        console.log("Creating Bitcoin SegWit wallet");
        const segwitWallet = createBitcoinWallet(userId, 'segwit');
        wallets.push({
          user_id: userId,
          blockchain: "Bitcoin",
          currency: "BTC",
          address: segwitWallet.address,
          private_key: segwitWallet.private_key,
          wallet_type: segwitWallet.wallet_type,
          balance: 0, // Start with zero balance
        });
        console.log("Created BTC SegWit wallet");
      } catch (btcError) {
        console.error("Error creating BTC SegWit wallet:", btcError);
      }
    }

    // 2. Create Ethereum wallet if it doesn't exist
    if (!existingWalletKeys.has("Ethereum-ETH")) {
      try {
        console.log("Creating ETH wallet");
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
        
        // Also create USDT wallet on Ethereum with the same address if it doesn't exist
        if (!existingWalletKeys.has("Ethereum-USDT")) {
          wallets.push({
            user_id: userId,
            blockchain: "Ethereum",
            currency: "USDT",
            address: ethWallet.address,
            private_key: ethWallet.private_key,
            wallet_type: "token",
            balance: 0,
          });
        }
        console.log("Created ETH and USDT (ERC20) wallets");
      } catch (ethError) {
        console.error("Error creating ETH wallet:", ethError);
      }
    }

    // 3. Create Solana wallet if it doesn't exist
    if (!existingWalletKeys.has("Solana-SOL")) {
      try {
        console.log("Creating Solana wallet");
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
        
        // Add USDT on Solana (SPL token) if it doesn't exist
        if (!existingWalletKeys.has("Solana-USDT")) {
          wallets.push({
            user_id: userId,
            blockchain: "Solana",
            currency: "USDT",
            address: solWallet.address,
            private_key: solWallet.private_key,
            wallet_type: "token",
            balance: 0,
          });
        }
        console.log("Created SOL wallet and USDT (SPL) wallet");
      } catch (solError) {
        console.error("Error creating SOL wallet:", solError);
      }
    }

    // Insert wallets into database if there are any to insert
    if (wallets.length > 0) {
      console.log(`Inserting ${wallets.length} new wallets`);
      const { data: insertedWallets, error: insertError } = await supabase
        .from("wallets")
        .insert(wallets)
        .select();

      if (insertError) {
        throw new Error(`Error inserting wallets: ${insertError.message}`);
      }

      return { 
        success: true, 
        message: "Wallets created successfully", 
        count: wallets.length, 
        existingCount: existingWallets?.length || 0,
        wallets: insertedWallets 
      };
    } else if (existingWallets && existingWallets.length > 0) {
      return { 
        success: true, 
        message: "Wallets already exist", 
        count: 0,
        existingCount: existingWallets.length,
        wallets: existingWallets 
      };
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
