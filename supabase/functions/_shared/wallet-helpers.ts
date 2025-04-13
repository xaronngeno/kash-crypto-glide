
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { generateHDWallets } from "./hd-wallet-core.ts";

/**
 * Generate a BIP39 mnemonic
 */
export function generateMnemonic() {
  try {
    // Use ethers to generate a valid BIP39 mnemonic
    const wallet = ethers.Wallet.createRandom();
    if (!wallet.mnemonic || !wallet.mnemonic.phrase) {
      throw new Error("Failed to generate valid mnemonic");
    }
    
    return wallet.mnemonic.phrase;
  } catch (error) {
    console.error("Error generating mnemonic:", error);
    throw error;
  }
}

/**
 * Get or create a seed phrase for a user
 */
export async function getOrCreateSeedPhrase(supabase: any, userId: string): Promise<string> {
  try {
    // Check if user already has a stored seed phrase
    const { data: existingMnemonic, error: fetchError } = await supabase
      .from('user_mnemonics')
      .select('main_mnemonic')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (fetchError) {
      console.error("Error fetching existing mnemonic:", fetchError);
    }
    
    if (existingMnemonic?.main_mnemonic) {
      console.log("Found existing seed phrase");
      return existingMnemonic.main_mnemonic;
    }
    
    // No existing seed phrase, generate a new one
    console.log("Generating new seed phrase");
    const mnemonic = generateMnemonic();
    
    // Store the mnemonic
    const { error: insertError } = await supabase
      .from('user_mnemonics')
      .insert({
        user_id: userId,
        main_mnemonic: mnemonic
      });
      
    if (insertError) {
      console.error("Error storing mnemonic:", insertError);
      throw insertError;
    }
    
    return mnemonic;
  } catch (error) {
    console.error("Error in getOrCreateSeedPhrase:", error);
    throw error;
  }
}

/**
 * Generate HD wallets for a user
 */
export async function generateHDWallets(seedPhrase: string, userId: string) {
  try {
    console.log("Generating HD wallets from seed phrase");
    
    // First validate the seed phrase
    if (!ethers.Mnemonic.isValidMnemonic(seedPhrase)) {
      throw new Error("Invalid seed phrase format");
    }
    
    // Now proceed with wallet generation
    return await generateHDWallets(seedPhrase, userId);
  } catch (error) {
    console.error("Error generating HD wallets:", error);
    throw error;
  }
}
