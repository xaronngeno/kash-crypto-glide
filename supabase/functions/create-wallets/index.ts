
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as bitcoinjs from "https://esm.sh/bitcoinjs-lib@6.1.5";
import * as ecc from "https://esm.sh/tiny-secp256k1@2.2.3";
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

// Generate Bitcoin wallet from mnemonic with better error handling
async function generateBitcoinWallet(mnemonic: string) {
  try {
    console.log("Attempting to generate Bitcoin wallet...");
    
    // Convert mnemonic to seed
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const seedBuffer = new Uint8Array(seed);
    
    try {
      // Initialize bitcoinjs with ecc
      bitcoinjs.initEccLib(ecc);
    } catch (initError) {
      console.error("Error initializing Bitcoin library:", initError);
      // Continue anyway, it might already be initialized
    }
    
    // Create a bitcoin network (mainnet)
    const network = bitcoinjs.networks.bitcoin;
    
    // Dynamically import bip32
    try {
      // Derive the key using BIP32
      const bip32 = await import("https://esm.sh/bip32@4.0.0");
      const root = bip32.BIP32Factory(ecc).fromSeed(seedBuffer, network);
      
      // Derive account using path
      const child = root.derivePath(DERIVATION_PATHS.BITCOIN);
      
      // Generate payment objects with error handling
      const payment = bitcoinjs.payments.p2wpkh({ 
        pubkey: child.publicKey, 
        network 
      });
      
      const address = payment.address;
      
      if (!address) {
        throw new Error('Failed to generate Bitcoin address');
      }
      
      console.log("Successfully generated Bitcoin wallet with address:", address);
      
      return {
        blockchain: 'Bitcoin',
        currency: 'BTC',
        address: address,
        privateKey: child.privateKey ? Buffer.toString(child.privateKey, 'hex') : undefined,
        wallet_type: 'derived',
      };
    } catch (bip32Error) {
      console.error("Error in BIP32 derivation:", bip32Error);
      throw new Error(`Bitcoin wallet generation failed at BIP32 step: ${bip32Error.message}`);
    }
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
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
    
    // Generate Bitcoin wallet with error handling
    try {
      const bitcoinWallet = await generateBitcoinWallet(mnemonic);
      wallets.push(bitcoinWallet);
      console.log("Successfully generated Bitcoin wallet");
    } catch (bitcoinError) {
      console.error("Failed to generate Bitcoin wallet, but continuing:", bitcoinError);
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
        // Use insert instead of upsert to avoid ON CONFLICT errors
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

    // Since there's an issue with the stored procedures, we'll use a direct mnemonic
    // Generate a new mnemonic
    const mnemonic = getOrCreateMnemonic();
    console.log("Using new mnemonic for HD wallet creation");
    
    // Try to store the mnemonic in the wallets table directly (simplified approach)
    try {
      const { data: mnemonicData, error: mnemonicError } = await supabase
        .from("user_mnemonics")
        .insert([{
          user_id: userId,
          main_mnemonic: mnemonic,
        }]);
      
      if (mnemonicError) {
        console.error("Error storing mnemonic directly:", mnemonicError);
      } else {
        console.log("Successfully stored mnemonic directly");
      }
    } catch (directMnemonicError) {
      console.error("Exception storing mnemonic directly:", directMnemonicError);
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
