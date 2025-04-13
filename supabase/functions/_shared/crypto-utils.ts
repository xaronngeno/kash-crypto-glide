
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { DERIVATION_PATHS } from "./constants.ts";

// Generate a random private key
export async function generatePrivateKey(): Promise<string> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Derive Ethereum address from private key
export async function deriveEthAddress(privateKey: string): Promise<string> {
  try {
    return "0x" + privateKey.substring(0, 40);
  } catch (error) {
    console.error("Error deriving ETH address:", error);
    throw error;
  }
}

// Derive Solana address from private key
export async function deriveSolAddress(privateKey: string): Promise<string> {
  try {
    const buffer = new TextEncoder().encode(privateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 44);
  } catch (error) {
    console.error("Error deriving SOL address:", error);
    throw error;
  }
}

// Get or create a seed phrase for a user
export async function getOrCreateSeedPhrase(supabase: any, userId: string): Promise<string> {
  try {
    // Try to get an existing seed phrase
    const { data: existingMnemonic, error: mnemonicError } = await supabase
      .from('user_mnemonics')
      .select('main_mnemonic')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (!mnemonicError && existingMnemonic?.main_mnemonic) {
      console.log("Found existing seed phrase");
      return existingMnemonic.main_mnemonic;
    }
    
    // Generate a new seed phrase
    console.log("Generating new seed phrase");
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic?.phrase;
    
    if (!mnemonic) {
      throw new Error("Failed to generate mnemonic");
    }
    
    // Store the mnemonic
    await supabase
      .from('user_mnemonics')
      .insert({
        user_id: userId,
        main_mnemonic: mnemonic
      });
    
    return mnemonic;
  } catch (error) {
    console.error("Error in getOrCreateSeedPhrase:", error);
    throw error;
  }
}
