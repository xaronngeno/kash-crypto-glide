import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as bip39 from "https://esm.sh/bip39@3.1.0";
import { corsHeaders } from "../_shared/cors.ts";

// Buffer polyfill for Deno
const Buffer = {
  from: (input: string | number[] | ArrayBuffer, encoding?: string) => {
    if (typeof input === 'string') {
      if (encoding === 'hex') {
        return new Uint8Array(input.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      }
      return new TextEncoder().encode(input);
    } else if (Array.isArray(input)) {
      return new Uint8Array(input);
    }
    return new Uint8Array(input);
  },
  alloc: (size: number, fill?: number) => {
    const buffer = new Uint8Array(size);
    if (fill !== undefined) {
      buffer.fill(fill);
    }
    return buffer;
  },
  toString: (buffer: Uint8Array, encoding?: string) => {
    if (encoding === 'hex') {
      return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return new TextDecoder().decode(buffer);
  }
};

// Generate a random mnemonic or validate an existing one
function getOrCreateMnemonic(existingMnemonic?: string): string {
  if (existingMnemonic) {
    if (!bip39.validateMnemonic(existingMnemonic)) {
      throw new Error('Invalid mnemonic phrase provided');
    }
    return existingMnemonic;
  }
  
  // Generate a new random mnemonic (defaults to 128-bits of entropy)
  return bip39.generateMnemonic();
}

// Define the derivation paths for different blockchains
const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  BITCOIN: "m/44'/0'/0'/0/0",
  SUI: "m/44'/784'/0'/0'/0'",
  MONAD: "m/44'/60'/0'/0/0", // Uses Ethereum path as Monad is EVM-compatible
};

// Generate Solana wallet from mnemonic using ed25519-hd-key derivation
async function generateSolanaWallet(mnemonic: string) {
  try {
    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const seedBuffer = new Uint8Array(seed);
    
    // Import dynamically
    const { derivePath } = await import("https://esm.sh/ed25519-hd-key@1.3.0");
    const { Keypair } = await import("https://esm.sh/@solana/web3.js@1.91.1");
    
    // Derive the keypair from the seed using the Solana path
    const derivedKey = derivePath(DERIVATION_PATHS.SOLANA, Buffer.toString(seedBuffer, 'hex')).key;
    
    // Create a Solana keypair from the derived key
    const keypair = Keypair.fromSeed(new Uint8Array(derivedKey));
    
    return {
      blockchain: 'Solana',
      currency: 'SOL',
      address: keypair.publicKey.toString(),
      privateKey: Buffer.toString(keypair.secretKey, 'hex'),
      wallet_type: 'derived',
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw error;
  }
}

// Generate Ethereum wallet from mnemonic
async function generateEVMWallet(mnemonic: string, blockchain: string, currency: string, path: string) {
  try {
    const ethers = await import("https://esm.sh/ethers@6.13.5");
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
    
    return {
      blockchain,
      currency,
      address: wallet.address,
      privateKey: wallet.privateKey,
      wallet_type: 'derived',
    };
  } catch (error) {
    console.error(`Error generating ${blockchain} wallet:`, error);
    throw error;
  }
}

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
}

// Generate wallets for a user - removing the Bitcoin wallet generation which is causing errors
async function generateWalletsForUser(supabase: any, userId: string, mnemonic: string) {
  try {
    console.log("Generating HD wallets from mnemonic for user:", userId);
    
    // Generate wallets from the same mnemonic for different chains
    const wallets = [];
    
    // Generate Ethereum wallet
    const ethereumWallet = await generateEVMWallet(
      mnemonic,
      'Ethereum',
      'ETH',
      DERIVATION_PATHS.ETHEREUM
    );
    wallets.push(ethereumWallet);
    
    // Generate Solana wallet - making sure to keep Solana
    try {
      const solanaWallet = await generateSolanaWallet(mnemonic);
      wallets.push(solanaWallet);
      console.log("Successfully generated Solana wallet");
    } catch (solanaError) {
      console.error("Failed to generate Solana wallet, but continuing:", solanaError);
      // Continue without failing the whole process
    }
    
    // Generate Monad wallet (using Ethereum derivation path since it's EVM compatible)
    const monadWallet = await generateEVMWallet(
      mnemonic,
      'Monad',
      'MONAD',
      DERIVATION_PATHS.MONAD
    );
    wallets.push(monadWallet);
    
    console.log(`Generated ${wallets.length} wallets for user ${userId}`);
    
    // Store wallets in database
    for (const wallet of wallets) {
      const { blockchain, currency, address, privateKey, wallet_type } = wallet;
      
      const { error } = await supabase
        .from('wallets')
        .upsert([{
          user_id: userId,
          blockchain,
          currency,
          address,
          private_key: privateKey,
          wallet_type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }], 
        { 
          onConflict: 'user_id, blockchain, currency',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error(`Error storing ${blockchain} wallet:`, error);
      }
    }
    
    return wallets;
  } catch (error) {
    console.error('Error in generateWalletsForUser:', error);
    throw error;
  }
}

// Main handler for the function
serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "No userId provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Try to fetch existing wallets first
    const { data: existingWallets, error: walletsError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId);
    
    if (walletsError) {
      console.error("Error fetching existing wallets:", walletsError);
    } else if (existingWallets && existingWallets.length > 0) {
      // User already has wallets
      console.log(`User ${userId} already has ${existingWallets.length} wallets`);
      return new Response(JSON.stringify({
        success: true,
        message: "User already has wallets",
        wallets: existingWallets
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to get existing mnemonic from the user_mnemonics table first
    const { data: mnemonicData, error: mnemonicError } = await supabase.rpc(
      'get_user_mnemonic',
      { user_id_param: userId }
    );
    
    let mnemonic;
    if (mnemonicError) {
      console.error("Error fetching user mnemonic:", mnemonicError);
      mnemonic = getOrCreateMnemonic(); // Generate a new one if there was an error
    } else if (mnemonicData && mnemonicData.length > 0) {
      console.log("Found existing mnemonic for user");
      mnemonic = mnemonicData[0].main_mnemonic;
    } else {
      console.log("No existing mnemonic found, generating a new one");
      mnemonic = getOrCreateMnemonic();
    }
    
    console.log("Using mnemonic for HD wallet creation");
    
    // Store the mnemonic (new or existing) to ensure it's saved
    const { error: storeMnemonicError } = await supabase.rpc(
      'store_user_mnemonic',
      {
        user_id_param: userId,
        mnemonic_param: mnemonic
      }
    );
    
    if (storeMnemonicError) {
      console.error("Error storing mnemonic:", storeMnemonicError);
    }
    
    const wallets = await generateWalletsForUser(supabase, userId, mnemonic);
    
    return new Response(JSON.stringify({
      success: true,
      message: "Wallets created successfully",
      wallets: wallets
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
