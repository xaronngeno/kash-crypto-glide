
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

// Enhanced decryption function that matches the new encryption
function decryptPrivateKey(encryptedKey: string, userId: string): string {
  try {
    // First try to decode base64
    const binary = atob(encryptedKey);
    
    // Create the same secure encryption key used for encryption
    const serverSalt = "KASH_SECURE_SALT_DO_NOT_CHANGE";
    const encryptionKeyBase = `${serverSalt}_${userId}_SECURE`;
    
    // Use Web Crypto API to create a secure key
    const encoder = new TextEncoder();
    const keyData = encoder.encode(encryptionKeyBase);
    
    // Create the digest
    return crypto.subtle.digest('SHA-256', keyData)
      .then(keyBytes => {
        const keyArray = Array.from(new Uint8Array(keyBytes));
        const bytes = [];
        
        // XOR each byte with the key
        for (let i = 0; i < binary.length; i++) {
          const keyByte = keyArray[i % keyArray.length];
          const encChar = binary.charCodeAt(i);
          bytes.push(encChar ^ keyByte);
        }
        
        // Convert to hex string with 0x prefix for ethers
        const hexString = "0x" + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
        return hexString;
      })
      .catch(error => {
        console.error("Crypto API error in decryption:", error);
        return legacyDecrypt(encryptedKey, userId);
      });
  } catch (error) {
    console.error("Decryption error:", error);
    // Fall back to legacy method
    return legacyDecrypt(encryptedKey, userId);
  }
}

// Legacy decryption function for backward compatibility
function legacyDecrypt(encryptedKey: string, userId: string): string {
  try {
    const encryptionKey = `KASH_SECRET_KEY_${userId}_SECURE`;
    const bytes = [];
    
    // Convert base64 to binary
    const binary = atob(encryptedKey);
    
    // XOR each byte with the key
    for (let i = 0; i < binary.length; i++) {
      const keyChar = encryptionKey[i % encryptionKey.length].charCodeAt(0);
      const encChar = binary.charCodeAt(i);
      bytes.push(encChar ^ keyChar);
    }
    
    // Convert to hex string with 0x prefix for ethers
    const hexString = "0x" + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexString;
  } catch (error) {
    console.error("Legacy decryption error:", error);
    throw new Error("Failed to decrypt private key");
  }
}

// Generate a seed phrase
function generateSeedPhrase(): string {
  try {
    // Create a random wallet which automatically generates a mnemonic
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic?.phrase || "";
  } catch (error) {
    console.error("Error generating seed phrase:", error);
    throw new Error("Failed to generate seed phrase");
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

    // If no stored mnemonic, generate a new one
    const seedPhrase = generateSeedPhrase();
    
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
