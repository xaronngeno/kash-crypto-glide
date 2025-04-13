import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { base58_decode, base58_encode } from "https://esm.sh/bs58@5.0.0/index.js";
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

// Generate a mnemonic seed phrase that will be used for all wallets
function generateHDWallets(userId: string) {
  try {
    console.log("Generating HD wallet from seed phrase...");
    
    // Create a random HD wallet (this automatically generates a mnemonic phrase)
    const hdWallet = ethers.Wallet.createRandom();
    const mnemonic = hdWallet.mnemonic?.phrase;
    
    if (!mnemonic) {
      throw new Error("Failed to generate mnemonic");
    }
    
    console.log("Successfully generated seed phrase");
    
    // Define derivation paths - only keep BTC, ETH, SOL
    const DERIVATION_PATHS = {
      BITCOIN_SEGWIT: "m/84'/0'/0'/0/0", // BIP84 - Native SegWit
      ETHEREUM: "m/44'/60'/0'/0/0",      // BIP44 - Ethereum
      SOLANA: "m/44'/501'/0'/0'"         // BIP44 - Solana
    };
    
    // Generate Ethereum wallet
    const ethHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.ETHEREUM
    );
    
    // Generate Solana wallet
    const solanaSeedNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.SOLANA
    );
    
    // Extract private key bytes (remove 0x prefix)
    const solPrivateKeyBytes = Buffer.from(solanaSeedNode.privateKey.slice(2), 'hex');
    
    // Create Solana keypair using the first 32 bytes
    const solanaKeypair = solanaWeb3.Keypair.fromSeed(solPrivateKeyBytes.slice(0, 32));
    
    // For Bitcoin, we'll use BIP84 derivation path for SegWit
    const btcSegwitHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.BITCOIN_SEGWIT
    );
    
    // Basic implementation of Bitcoin P2WPKH (SegWit) address derivation
    // Extract the public key (removing 0x prefix if present)
    const pubKeyHex = btcSegwitHdNode.publicKey.startsWith('0x') 
      ? btcSegwitHdNode.publicKey.slice(2) 
      : btcSegwitHdNode.publicKey;
    
    // Use Base58 encoding and standard Bitcoin SegWit prefix
    // This is a simplified implementation - in production use bitcoinjs-lib
    const btcSegwitAddress = `bc1q${base58_encode(Buffer.from(pubKeyHex.slice(0, 20), 'hex'))}`;
    
    // Return only BTC, ETH, SOL wallet data
    return {
      mnemonic, 
      ethereum: {
        address: ethHdNode.address,
        privateKey: ethHdNode.privateKey
      },
      solana: {
        address: solanaKeypair.publicKey.toString(),
        privateKey: Buffer.from(solanaKeypair.secretKey).toString('hex')
      },
      bitcoinSegwit: {
        address: btcSegwitAddress,
        privateKey: btcSegwitHdNode.privateKey
      }
    };
  } catch (error) {
    console.error("Error generating HD wallet:", error);
    throw error;
  }
}

// Create wallet addresses for a user
async function createUserWallets(supabase: any, userId: string) {
  try {
    console.log(`Creating wallets for user: ${userId}`);
    
    // Check if user already has wallets to prevent duplicates
    const { data: existingWalletsCheck, error: existingWalletsError } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
      
    if (existingWalletsError) {
      console.error("Error checking existing wallets:", existingWalletsError);
    } else if (existingWalletsCheck && existingWalletsCheck.length > 0) {
      console.log(`User ${userId} already has wallets, skipping creation`);
      
      // Return existing wallets instead of creating new ones
      const { data: userWallets, error: walletsError } = await supabase
        .from("wallets")
        .select("blockchain, currency, address, wallet_type")
        .eq("user_id", userId);
        
      if (walletsError) {
        console.error("Error fetching existing wallets:", walletsError);
      } else {
        return {
          success: true,
          message: "Using existing wallets",
          count: userWallets.length,
          wallets: userWallets
        };
      }
    }
    
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

    // Generate HD wallets from a single seed phrase
    const hdWallets = generateHDWallets(userId);
    
    // Check if there's already a mnemonic saved to prevent duplicates
    const { data: existingMnemonic, error: mnemonicCheckError } = await supabase
      .from('user_mnemonics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (mnemonicCheckError) {
      console.error("Error checking existing mnemonic:", mnemonicCheckError);
    }
    
    // Only store seed phrase if it doesn't exist
    if (!existingMnemonic) {
      // Store the mnemonic
      const { error: mnemonicError } = await supabase
        .from('user_mnemonics')
        .insert({
          user_id: userId,
          main_mnemonic: hdWallets.mnemonic
        });
        
      if (mnemonicError) {
        console.error("Error storing mnemonic:", mnemonicError);
      } else {
        console.log("Stored seed phrase successfully");
      }
    }

    // Create wallet objects to insert - only create what's needed
    const wallets = [];

    // 1. Create Bitcoin wallet if it doesn't exist - ONLY SegWit
    if (!existingWalletKeys.has("Bitcoin-BTC-Native SegWit")) {
      try {
        console.log("Creating Bitcoin SegWit wallet");
        wallets.push({
          user_id: userId,
          blockchain: "Bitcoin",
          currency: "BTC",
          address: hdWallets.bitcoinSegwit.address,
          private_key: encryptPrivateKey(hdWallets.bitcoinSegwit.privateKey, userId),
          wallet_type: "Native SegWit",
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
        wallets.push({
          user_id: userId,
          blockchain: "Ethereum",
          currency: "ETH",
          address: hdWallets.ethereum.address,
          private_key: encryptPrivateKey(hdWallets.ethereum.privateKey, userId),
          wallet_type: "imported",
          balance: 0,
        });
        console.log("Created ETH wallet");
      } catch (ethError) {
        console.error("Error creating ETH wallet:", ethError);
      }
    }

    // 3. Create Solana wallet if it doesn't exist
    if (!existingWalletKeys.has("Solana-SOL")) {
      try {
        console.log("Creating Solana wallet");
        wallets.push({
          user_id: userId,
          blockchain: "Solana",
          currency: "SOL",
          address: hdWallets.solana.address,
          private_key: encryptPrivateKey(hdWallets.solana.privateKey, userId),
          wallet_type: "imported",
          balance: 0,
        });
        console.log("Created SOL wallet");
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
        wallets: insertedWallets,
        seedPhrase: hdWallets.mnemonic
      };
    } else if (existingWallets && existingWallets.length > 0) {
      // Check if there's an existing mnemonic to return
      const { data: mnemonicData } = await supabase
        .from('user_mnemonics')
        .select('main_mnemonic')
        .eq('user_id', userId)
        .maybeSingle();
      
      return { 
        success: true, 
        message: "Wallets already exist", 
        count: 0,
        existingCount: existingWallets.length,
        wallets: existingWallets,
        seedPhrase: mnemonicData?.main_mnemonic
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
