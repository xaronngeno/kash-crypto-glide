import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as bip39 from "https://esm.sh/bip39@3.1.0";
import { corsHeaders } from "../_shared/cors.ts";

// Define the derivation paths for different blockchains
const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  BITCOIN: "m/44'/0'/0'/0/0",
  TRON: "m/44'/195'/0'/0/0",
  SUI: "m/44'/784'/0'/0'/0'",
  MONAD: "m/44'/60'/0'/0/0", // Uses Ethereum path as Monad is EVM-compatible
};

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
  
  // Generate a new random mnemonic (12 words = 128-bits of entropy)
  return bip39.generateMnemonic(128);
}

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

// Generate Tron wallet from mnemonic
async function generateTronWallet(mnemonic: string) {
  try {
    console.log("Attempting to generate Tron wallet...");
    
    // We'll use ethers.js for the HD wallet derivation then convert the format
    const ethers = await import("https://esm.sh/ethers@6.13.5");
    
    // Use the TRON derivation path
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, DERIVATION_PATHS.TRON);
    
    // Get the raw public key from the derived wallet
    const publicKeyBytes = ethers.getBytes(wallet.publicKey);
    
    // Import keccak256 for address generation
    const { keccak_256 } = await import("https://esm.sh/js-sha3@0.9.2");
    
    // Remove the '0x04' prefix if it exists (compression flag)
    const pubKeyNoPrefix = publicKeyBytes.slice(0, 1)[0] === 4 ? publicKeyBytes.slice(1) : publicKeyBytes;
    
    // Hash the public key with keccak256
    const pubKeyHash = keccak_256(pubKeyNoPrefix);
    
    // Take the last 20 bytes and prefix with 0x41 (ASCII 'A')
    const addressHex = '41' + pubKeyHash.substring(pubKeyHash.length - 40);
    const addressBytes = Buffer.from(addressHex, 'hex');
    
    // Convert to base58 encoding (Tron's address format)
    const { encode } = await import("https://esm.sh/bs58@5.0.0");
    const tronAddress = encode(addressBytes);
    
    console.log("Successfully generated Tron wallet with address:", tronAddress);
    
    return {
      blockchain: 'Tron',
      currency: 'TRX',
      address: tronAddress,
      privateKey: wallet.privateKey,
      wallet_type: 'derived',
    };
  } catch (error) {
    console.error('Error generating Tron wallet:', error);
    throw error;
  }
}

// Generate Sui wallet from mnemonic
async function generateSuiWallet(mnemonic: string) {
  try {
    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const seedHex = Array.from(new Uint8Array(seed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Import dynamically
    const { derivePath } = await import("https://esm.sh/ed25519-hd-key@1.3.0");
    
    // Derive the keypair from the seed using the Sui path
    const { key } = derivePath(DERIVATION_PATHS.SUI, seedHex);
    
    // Import Sui keypair
    const { Ed25519Keypair } = await import("https://esm.sh/@mysten/sui.js/keypairs/ed25519");
    
    // Create a keypair with the derived key
    const keyPair = new Ed25519Keypair({
      secretKey: new Uint8Array([...key, ...new Uint8Array(32-key.length)].slice(0, 32))
    });
    
    return {
      blockchain: 'Sui',
      currency: 'SUI',
      address: keyPair.getPublicKey().toSuiAddress(),
      privateKey: Buffer.toString(key, 'hex'),
      wallet_type: 'derived',
    };
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
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

// Fetch existing mnemonic for a user
async function getUserMnemonic(supabase: any, userId: string): Promise<string | null> {
  try {
    console.log(`Checking for existing mnemonic for user: ${userId}`);
    const { data, error } = await supabase
      .from("user_mnemonics")
      .select("main_mnemonic")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching mnemonic:", error);
      return null;
    }
    
    return data?.main_mnemonic || null;
  } catch (err) {
    console.error("Error in getUserMnemonic:", err);
    return null;
  }
}

// Store a user's mnemonic
async function storeUserMnemonic(supabase: any, userId: string, mnemonic: string): Promise<boolean> {
  try {
    console.log(`Storing mnemonic for user: ${userId}`);
    
    const { error } = await supabase
      .from("user_mnemonics")
      .upsert({
        user_id: userId,
        main_mnemonic: mnemonic,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });
    
    if (error) {
      console.error("Error storing mnemonic:", error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error in storeUserMnemonic:", err);
    return false;
  }
}

// Generate wallets for a user with proper error handling for each chain
async function generateWalletsForUser(supabase: any, userId: string, mnemonic: string) {
  try {
    console.log("Generating HD wallets from mnemonic for user:", userId);
    
    // Generate wallets from the same mnemonic for different chains
    const wallets = [];
    
    // Generate Ethereum wallet
    try {
      const ethereumWallet = await generateEVMWallet(
        mnemonic,
        'Ethereum',
        'ETH',
        DERIVATION_PATHS.ETHEREUM
      );
      wallets.push(ethereumWallet);
      console.log("Successfully generated Ethereum wallet");
    } catch (ethError) {
      console.error("Failed to generate Ethereum wallet, but continuing:", ethError);
    }
    
    // Generate Solana wallet with error handling
    try {
      const solanaWallet = await generateSolanaWallet(mnemonic);
      wallets.push(solanaWallet);
      console.log("Successfully generated Solana wallet");
    } catch (solanaError) {
      console.error("Failed to generate Solana wallet, but continuing:", solanaError);
    }
    
    // Generate Tron wallet with error handling
    try {
      const tronWallet = await generateTronWallet(mnemonic);
      wallets.push(tronWallet);
      console.log("Successfully generated Tron wallet");
    } catch (tronError) {
      console.error("Failed to generate Tron wallet, but continuing:", tronError);
    }
    
    // Generate Sui wallet with error handling
    try {
      const suiWallet = await generateSuiWallet(mnemonic);
      wallets.push(suiWallet);
      console.log("Successfully generated Sui wallet");
    } catch (suiError) {
      console.error("Failed to generate Sui wallet, but continuing:", suiError);
    }
    
    // Generate Monad wallet (using Ethereum derivation path since it's EVM compatible)
    try {
      const monadWallet = await generateEVMWallet(
        mnemonic,
        'Monad',
        'MONAD',
        DERIVATION_PATHS.MONAD
      );
      wallets.push(monadWallet);
      console.log("Successfully generated Monad wallet");
    } catch (monadError) {
      console.error("Failed to generate Monad wallet, but continuing:", monadError);
    }
    
    console.log(`Generated ${wallets.length} wallets for user ${userId}`);
    
    // Store wallets in database
    const successfullyStoredWallets = [];
    for (const wallet of wallets) {
      const { blockchain, currency, address, privateKey, wallet_type } = wallet;
      
      try {
        // Check for existing wallet to avoid duplicates
        const { data: existingWallet, error: checkError } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', userId)
          .eq('blockchain', blockchain)
          .eq('currency', currency)
          .maybeSingle();
          
        if (checkError) {
          console.error(`Error checking for existing ${blockchain} wallet:`, checkError);
          continue;
        }
        
        if (existingWallet) {
          // Wallet already exists, just add it to the success list
          successfullyStoredWallets.push(wallet);
          continue;
        }
        
        // Create a new wallet
        const { data: insertedWallet, error } = await supabase
          .from('wallets')
          .insert([{
            user_id: userId,
            blockchain,
            currency,
            address,
            private_key: privateKey,
            wallet_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (error) {
          console.error(`Error storing ${blockchain} wallet:`, error);
        } else {
          successfullyStoredWallets.push(wallet);
        }
      } catch (insertError) {
        console.error(`Exception storing ${blockchain} wallet:`, insertError);
      }
    }
    
    return successfullyStoredWallets.length > 0 ? successfullyStoredWallets : wallets;
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
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid JSON in request body" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const userId = requestData.userId;
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "No userId provided" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    // Check for existing wallets for this user
    const { data: existingWallets, error: walletsError } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId);
    
    if (walletsError) {
      console.error("Error fetching existing wallets:", walletsError);
    } else if (existingWallets && existingWallets.length > 0) {
      // User already has wallets
      console.log(`User ${userId} already has ${existingWallets.length} wallets`);
      
      // Make sure the mnemonic is stored
      const existingMnemonic = await getUserMnemonic(supabase, userId);
      if (!existingMnemonic) {
        // If wallets exist but no mnemonic, this is an inconsistent state
        console.warn("User has wallets but no mnemonic stored. This could lead to recovery issues.");
      }
      
      // Return the existing wallets
      return new Response(JSON.stringify({
        success: true,
        message: "User already has wallets",
        wallets: existingWallets
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Get existing mnemonic or create a new one
    let mnemonic = await getUserMnemonic(supabase, userId);
    
    if (!mnemonic) {
      // Generate a new mnemonic if none exists (using getOrCreateMnemonic helper)
      mnemonic = bip39.generateMnemonic(128); // 12 words
      console.log("Generated new mnemonic for user");
      
      // Store the mnemonic
      const mnemonicStored = await storeUserMnemonic(supabase, userId, mnemonic);
      if (!mnemonicStored) {
        return new Response(JSON.stringify({
          success: false,
          error: "Failed to store mnemonic"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    } else {
      console.log("Using existing mnemonic for wallet generation");
    }
    
    const wallets = await generateWalletsForUser(supabase, userId, mnemonic);
    
    // Return success message with wallets
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
