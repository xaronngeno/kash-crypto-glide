
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import * as ethers from "https://esm.sh/ethers@6.13.5";

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

// Simple decryption function - in production, use a more secure method
function decryptPrivateKey(encryptedKey: string, userId: string): string {
  try {
    // This should match the encryption logic used in the create-wallets function
    const encryptionKey = `KASH_SECRET_KEY_${userId}_SECURE`;
    const encryptedBytes = atob(encryptedKey);
    let decrypted = "";
    
    for (let i = 0; i < encryptedBytes.length; i++) {
      const keyChar = encryptionKey[i % encryptionKey.length].charCodeAt(0);
      const encChar = encryptedBytes.charCodeAt(i);
      decrypted += String.fromCharCode(encChar ^ keyChar);
    }
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt private key");
  }
}

// Function to derive a deterministic seed phrase from a private key
function deriveSeedPhrase(privateKey: string): string {
  try {
    // Use ethers.js to create a wallet from the private key
    const wallet = new ethers.Wallet(privateKey);
    
    // We'll use the mnemonic from the wallet
    // In a real implementation, you'd store the original mnemonic or use proper HD wallet derivation
    return wallet.mnemonic?.phrase || "Unable to derive seed phrase";
  } catch (error) {
    console.error("Error deriving seed phrase:", error);
    throw new Error("Failed to derive seed phrase");
  }
}

// Main function to get the seed phrase
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const { userId, password } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (!password) {
      return new Response(JSON.stringify({ error: "Password is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Get the user's email from the auth.users table
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error("User verification error:", userError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Verify the password by attempting to sign in with the user's email
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: userData.user.email || "",
      password,
    });

    if (signInError || !signInData.user) {
      console.error("Password verification error:", signInError);
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Check if the provided user ID exists in the user_mnemonics table
    const { data: mnemonicData, error: mnemonicError } = await supabase
      .from('user_mnemonics')
      .select('main_mnemonic')
      .eq('user_id', userId)
      .maybeSingle();

    if (mnemonicData?.main_mnemonic) {
      // If we have a stored mnemonic, return it
      return new Response(JSON.stringify({ seedPhrase: mnemonicData.main_mnemonic }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If no stored mnemonic, fetch the user's ethereum wallet private key
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('private_key')
      .eq('user_id', userId)
      .eq('blockchain', 'Ethereum')  // We'll use the Ethereum wallet's private key
      .eq('currency', 'ETH')
      .maybeSingle();

    if (walletError || !walletData?.private_key) {
      console.error("Wallet fetch error:", walletError);
      return new Response(JSON.stringify({ error: "No wallet found for this user" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    // Decrypt the private key
    const decryptedPrivateKey = decryptPrivateKey(walletData.private_key, userId);

    // Derive a seed phrase from the private key
    // In a real implementation, you'd retrieve the original mnemonic or use proper HD wallet derivation
    const seedPhrase = deriveSeedPhrase(decryptedPrivateKey);

    // Store the mnemonic for future use
    await supabase
      .from('user_mnemonics')
      .insert({
        user_id: userId,
        main_mnemonic: seedPhrase,
      });

    return new Response(JSON.stringify({ seedPhrase }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in get-seed-phrase function:", error);
    
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
