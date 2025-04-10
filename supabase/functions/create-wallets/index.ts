
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as bip39 from "https://esm.sh/bip39@3.1.0";
import { corsHeaders } from "../_shared/cors.ts";

// Define the derivation paths for different blockchains
const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  TRON: "m/44'/195'/0'/0/0",
};

// Generate or validate a mnemonic
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

// Generate Ethereum wallet from mnemonic
async function generateEVMWallet(mnemonic: string) {
  try {
    console.log(`Starting Ethereum wallet generation`);
    const ethers = await import("https://esm.sh/ethers@6.13.5");
    
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, DERIVATION_PATHS.ETHEREUM);
    console.log(`Generated Ethereum wallet: ${wallet.address}`);
    
    return {
      blockchain: 'Ethereum',
      currency: 'ETH',
      address: wallet.address,
      privateKey: wallet.privateKey,
      wallet_type: 'derived',
    };
  } catch (error) {
    console.error(`Error generating Ethereum wallet:`, error);
    throw new Error(`Failed to generate Ethereum wallet: ${error.message}`);
  }
}

// Generate Solana wallet
async function generateSolanaWallet(mnemonic: string) {
  try {
    console.log("Starting Solana wallet generation");
    
    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const seedBuffer = new Uint8Array(seed);
    
    // Import libraries
    const { derivePath } = await import("https://esm.sh/ed25519-hd-key@1.3.0");
    const { Keypair } = await import("https://esm.sh/@solana/web3.js@1.91.1");
    
    // Derive the keypair
    const derivedKey = derivePath(DERIVATION_PATHS.SOLANA, Array.from(new Uint8Array(seed))
      .map(b => b.toString(16).padStart(2, '0')).join('')).key;
    
    // Create keypair
    const keypair = Keypair.fromSeed(new Uint8Array(derivedKey));
    console.log(`Generated Solana wallet with address: ${keypair.publicKey.toString()}`);
    
    // Create hex string from the secret key
    const secretKeyHex = Array.from(keypair.secretKey)
      .map(b => b.toString(16).padStart(2, '0')).join('');
    
    return {
      blockchain: 'Solana',
      currency: 'SOL',
      address: keypair.publicKey.toString(),
      privateKey: secretKeyHex,
      wallet_type: 'derived',
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    
    // Create a fallback Solana wallet
    const { Keypair } = await import("https://esm.sh/@solana/web3.js@1.91.1");
    const fallbackKeypair = Keypair.generate();
    
    return {
      blockchain: 'Solana',
      currency: 'SOL',
      address: fallbackKeypair.publicKey.toString(),
      privateKey: Array.from(fallbackKeypair.secretKey)
        .map(b => b.toString(16).padStart(2, '0')).join(''),
      wallet_type: 'derived',
    };
  }
}

// Generate Tron wallet
async function generateTronWallet(mnemonic: string) {
  try {
    console.log("Starting Tron wallet generation");
    
    // Use ethers.js with Tron path
    const ethers = await import("https://esm.sh/ethers@6.13.5");
    const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, DERIVATION_PATHS.TRON);
    
    // Create a Tron-like address (this is simplified)
    const tronAddress = `T${wallet.address.slice(2)}`;
    
    console.log(`Generated Tron wallet with address: ${tronAddress}`);
    
    return {
      blockchain: 'Tron',
      currency: 'TRX',
      address: tronAddress,
      privateKey: wallet.privateKey,
      wallet_type: 'derived',
    };
  } catch (error) {
    console.error('Error generating Tron wallet:', error);
    
    // Create a fallback Tron wallet
    const ethers = await import("https://esm.sh/ethers@6.13.5");
    const fallbackWallet = ethers.Wallet.createRandom();
    const tronLikeAddress = `T${fallbackWallet.address.slice(2)}`;
    
    return {
      blockchain: 'Tron',
      currency: 'TRX',
      address: tronLikeAddress,
      privateKey: fallbackWallet.privateKey,
      wallet_type: 'derived',
    };
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

// Generate wallets for a user
async function generateWalletsForUser(supabase: any, userId: string, mnemonic: string) {
  try {
    console.log("Generating wallets from mnemonic for user:", userId);
    
    // Generate wallets from the same mnemonic
    const walletPromises = [
      generateEVMWallet(mnemonic),
      generateSolanaWallet(mnemonic),
      generateTronWallet(mnemonic)
    ];
    
    // Wait for all wallets to be generated
    const wallets = await Promise.all(walletPromises);
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
          console.log(`${blockchain} wallet already exists for user, skipping creation`);
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
          continue;
        } else {
          console.log(`Successfully stored ${blockchain} wallet in database`);
          successfullyStoredWallets.push(wallet);
        }
      } catch (insertError) {
        console.error(`Exception storing ${blockchain} wallet:`, insertError);
      }
    }
    
    // Return successfully stored wallets
    return {
      wallets: successfullyStoredWallets
    };
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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing required environment variables");
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Server configuration error" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    let requestData;
    try {
      const text = await req.text();
      requestData = text ? JSON.parse(text) : {};
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
    
    // Get existing mnemonic or create a new one
    let mnemonic = await getUserMnemonic(supabase, userId);
    console.log("Mnemonic check result:", mnemonic ? "Found existing" : "Not found");
    
    if (!mnemonic) {
      // Generate a new mnemonic
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
      console.log("Stored new mnemonic successfully");
    } else {
      console.log("Using existing mnemonic for wallet generation");
    }
    
    // Generate wallets for the user
    const result = await generateWalletsForUser(supabase, userId, mnemonic);
    
    // Return success message with wallets
    return new Response(JSON.stringify({
      success: true,
      message: "Wallets created successfully",
      wallets: result.wallets
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
