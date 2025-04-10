import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import * as bitcoinjs from "https://esm.sh/bitcoinjs-lib@6.1.5";
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { decode as base58_decode, encode as base58_encode } from "https://esm.sh/bs58@5.0.0";
import * as solanaWeb3 from "https://esm.sh/@solana/web3.js@1.91.1";
import * as bip39 from "https://esm.sh/bip39@3.1.0";
import { derivePath } from "https://esm.sh/ed25519-hd-key@1.3.0";

const BufferPolyfill = {
  from: (data, encoding) => {
    if (typeof data === 'string') {
      if (encoding === 'hex') {
        const bytes = new Uint8Array(data.length / 2);
        for (let i = 0; i < data.length; i += 2) {
          bytes[i / 2] = parseInt(data.substring(i, i + 2), 16);
        }
        return bytes;
      }
      return new TextEncoder().encode(data);
    }
    if (Array.isArray(data)) {
      return new Uint8Array(data);
    }
    return data;
  },
  toString: (buffer, encoding) => {
    if (encoding === 'hex') {
      return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    return new TextDecoder().decode(buffer);
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
}

const DERIVATION_PATHS = {
  ETHEREUM: "m/44'/60'/0'/0/0",
  SOLANA: "m/44'/501'/0'/0'",
  BITCOIN: "m/44'/0'/0'/0/0",
  BNB_CHAIN: "m/44'/714'/0'/0/0",
  POLYGON: "m/44'/60'/0'/0/0", // Uses Ethereum path
  AVALANCHE: "m/44'/9000'/0'/0/0",
  TRON: "m/44'/195'/0'/0/0",
};

function encryptPrivateKey(privateKey: string, userId: string): string {
  try {
    const encryptionKey = `KASH_SECRET_KEY_${userId}_SECURE`;
    let encrypted = "";
    
    for (let i = 0; i < privateKey.length; i++) {
      const keyChar = encryptionKey[i % encryptionKey.length].charCodeAt(0);
      const plainChar = privateKey[i].charCodeAt(0);
      encrypted += String.fromCharCode(plainChar ^ keyChar);
    }
    
    return btoa(encrypted);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt private key");
  }
}

function getOrCreateMnemonic(existingMnemonic?: string): string {
  if (existingMnemonic) {
    if (!bip39.validateMnemonic(existingMnemonic)) {
      throw new Error('Invalid mnemonic phrase provided');
    }
    return existingMnemonic;
  }
  
  return bip39.generateMnemonic();
}

function createSolanaWalletFromMnemonic(mnemonic: string, userId: string) {
  try {
    console.log("Creating Solana wallet from mnemonic...");
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const seedHex = Array.from(new Uint8Array(seed))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const { key } = derivePath(DERIVATION_PATHS.SOLANA, seedHex);
    
    const keypair = solanaWeb3.Keypair.fromSeed(key);
    const privateKeyHex = Array.from(keypair.secretKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return {
      address: keypair.publicKey.toString(),
      private_key: encryptPrivateKey(privateKeyHex, userId),
    };
  } catch (error) {
    console.error("Error creating Solana wallet:", error);
    throw new Error(`Failed to create Solana wallet: ${error.message}`);
  }
}

function createTronWalletFromMnemonic(mnemonic: string, userId: string) {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic, DERIVATION_PATHS.TRON);
    const ethAddressHex = wallet.address.slice(2);
    const tronAddress = `T${ethAddressHex}`;
    return {
      address: tronAddress,
      private_key: encryptPrivateKey(wallet.privateKey, userId),
    };
  } catch (error) {
    console.error("Error creating Tron wallet:", error);
    throw new Error(`Failed to create Tron wallet: ${error.message}`);
  }
}

function createBitcoinWalletFromMnemonic(mnemonic: string, userId: string) {
  try {
    console.log("Creating Bitcoin wallet from mnemonic...");
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const dummyAddress = "bc1" + Array.from(seed.slice(0, 20))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 38);
    const privateKey = Array.from(seed.slice(0, 32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return {
      address: dummyAddress,
      private_key: encryptPrivateKey(privateKey, userId),
    };
  } catch (error) {
    console.error("Error creating BTC wallet:", error);
    throw new Error(`Failed to create BTC wallet: ${error.message}`);
  }
}

function createEVMWalletFromMnemonic(mnemonic: string, path: string, blockchain: string, currency: string, userId: string) {
  try {
    const wallet = ethers.Wallet.fromPhrase(mnemonic, path);
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

async function createUserWallets(supabase: any, userId: string) {
  try {
    console.log(`Creating wallets for user: ${userId}`);
    
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("numeric_id")
      .eq("id", userId)
      .maybeSingle();
      
    if (profileError) {
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }
    
    let numeric_id = profile?.numeric_id;
    
    if (!profile || !numeric_id) {
      console.log("User doesn't have a numeric ID yet, generating one");
      numeric_id = null;
      let idUnique = false;
      
      for (let attempts = 0; attempts < 10 && !idUnique; attempts++) {
        numeric_id = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
        
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
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ numeric_id })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(`Error updating user's numeric ID: ${updateError.message}`);
      }
      
      console.log(`Assigned numeric ID ${numeric_id} to user ${userId}`);
    }
    
    const { data: existingWallets, error: checkError } = await supabase
      .from("wallets")
      .select("currency, blockchain")
      .eq("user_id", userId);

    if (checkError) {
      throw new Error(`Error checking existing wallets: ${checkError.message}`);
    }

    const existingWalletKeys = new Set();
    if (existingWallets && existingWallets.length > 0) {
      console.log(`User ${userId} already has ${existingWallets.length} wallets`);
      
      existingWallets.forEach(wallet => {
        existingWalletKeys.add(`${wallet.blockchain}-${wallet.currency}`);
      });
    }

    const mnemonic = getOrCreateMnemonic();
    console.log("Generated BIP-39 mnemonic for HD wallet creation");
    
    const { error: mnemonicError } = await supabase
      .from("user_mnemonics")
      .upsert([{
        user_id: userId,
        main_mnemonic: mnemonic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (mnemonicError) {
      console.error("Error saving mnemonic:", mnemonicError);
    }
    
    const wallets = [];

    if (!existingWalletKeys.has("Bitcoin-BTC")) {
      try {
        console.log("Creating Bitcoin wallet");
        const btcWallet = createBitcoinWalletFromMnemonic(mnemonic, userId);
        wallets.push({
          user_id: userId,
          blockchain: "Bitcoin",
          currency: "BTC",
          address: btcWallet.address,
          private_key: btcWallet.private_key,
          wallet_type: "imported",
          balance: 0,
        });
        console.log("Created BTC wallet");
      } catch (btcError) {
        console.error("Error creating BTC wallet:", btcError);
      }
    }

    if (!existingWalletKeys.has("Ethereum-ETH")) {
      try {
        console.log("Creating ETH wallet from mnemonic");
        const ethWallet = createEVMWalletFromMnemonic(
          mnemonic, 
          DERIVATION_PATHS.ETHEREUM, 
          "Ethereum", 
          "ETH", 
          userId
        );
        
        wallets.push({
          user_id: userId,
          blockchain: ethWallet.blockchain,
          currency: ethWallet.currency,
          address: ethWallet.address,
          private_key: ethWallet.private_key,
          wallet_type: "imported",
          balance: 0,
        });
        
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

    if (!existingWalletKeys.has("Solana-SOL")) {
      try {
        console.log("Creating Solana wallet from mnemonic");
        const solWallet = createSolanaWalletFromMnemonic(mnemonic, userId);
        wallets.push({
          user_id: userId,
          blockchain: "Solana",
          currency: "SOL",
          address: solWallet.address,
          private_key: solWallet.private_key,
          wallet_type: "imported",
          balance: 0,
        });
        
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

    if (!existingWalletKeys.has("Tron-TRX")) {
      try {
        console.log("Creating Tron wallet from mnemonic");
        const tronWallet = createTronWalletFromMnemonic(mnemonic, userId);
        wallets.push({
          user_id: userId,
          blockchain: "Tron",
          currency: "TRX",
          address: tronWallet.address,
          private_key: tronWallet.private_key,
          wallet_type: "imported",
          balance: 0,
        });
        
        if (!existingWalletKeys.has("Tron-USDT")) {
          wallets.push({
            user_id: userId,
            blockchain: "Tron",
            currency: "USDT",
            address: tronWallet.address,
            private_key: tronWallet.private_key,
            wallet_type: "token",
            balance: 0,
          });
        }
        console.log("Created TRX wallet and USDT (TRC20) wallet");
      } catch (tronError) {
        console.error("Error creating TRX wallet:", tronError);
      }
    }

    try {
      if (!existingWalletKeys.has("Binance Smart Chain-BNB")) {
        console.log("Creating BSC wallet from mnemonic");
        const bscWallet = createEVMWalletFromMnemonic(
          mnemonic,
          DERIVATION_PATHS.BNB_CHAIN, 
          "Binance Smart Chain", 
          "BNB", 
          userId
        );
        
        wallets.push({
          user_id: userId,
          blockchain: bscWallet.blockchain,
          currency: bscWallet.currency,
          address: bscWallet.address,
          private_key: bscWallet.private_key,
          wallet_type: "imported",
          balance: 0,
        });
        
        if (!existingWalletKeys.has("Binance Smart Chain-USDT")) {
          wallets.push({
            user_id: userId,
            blockchain: "Binance Smart Chain",
            currency: "USDT",
            address: bscWallet.address,
            private_key: bscWallet.private_key,
            wallet_type: "token",
            balance: 0,
          });
        }
      }
      
      if (!existingWalletKeys.has("Polygon-MATIC")) {
        console.log("Creating Polygon wallet from mnemonic");
        const polygonWallet = createEVMWalletFromMnemonic(
          mnemonic,
          DERIVATION_PATHS.POLYGON,
          "Polygon",
          "MATIC",
          userId
        );
        
        wallets.push({
          user_id: userId,
          blockchain: polygonWallet.blockchain,
          currency: polygonWallet.currency,
          address: polygonWallet.address,
          private_key: polygonWallet.private_key,
          wallet_type: "imported",
          balance: 0,
        });
        
        if (!existingWalletKeys.has("Polygon-USDT")) {
          wallets.push({
            user_id: userId,
            blockchain: "Polygon",
            currency: "USDT",
            address: polygonWallet.address,
            private_key: polygonWallet.private_key,
            wallet_type: "token",
            balance: 0,
          });
        }
      }
      
      console.log("Created additional EVM wallets and USDT tokens");
    } catch (evmError) {
      console.error("Error creating additional EVM wallets:", evmError);
    }

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
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const userId = requestData.userId;
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "No userId provided" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const result = await createUserWallets(supabase, userId);

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
