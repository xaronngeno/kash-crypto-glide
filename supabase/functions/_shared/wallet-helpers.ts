
import * as bip39 from "https://esm.sh/bip39@3.1.0";

/**
 * Generate or retrieve a seed phrase for a user
 * This is a critical function that needs proper error handling
 */
export async function getOrCreateSeedPhrase(supabase: any, userId: string): Promise<string> {
  try {
    // First check if the user already has a seed phrase
    const { data: mnemonicData, error: mnemonicError } = await supabase
      .from('user_mnemonics')
      .select('main_mnemonic')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (mnemonicError) {
      console.error("Error checking for existing seed phrase:", mnemonicError);
    }
    
    // If a seed phrase exists, return it
    if (mnemonicData?.main_mnemonic) {
      console.log("Found existing seed phrase");
      return mnemonicData.main_mnemonic;
    }
    
    console.log("No existing seed phrase found, generating new one");
    
    // Generate a new random seed phrase (12 words by default)
    const seedPhrase = bip39.generateMnemonic(128); // 128 bits = 12 words
    
    // Store the seed phrase in the database
    const { error: insertError } = await supabase
      .from('user_mnemonics')
      .insert({
        user_id: userId,
        main_mnemonic: seedPhrase
      })
      .select()
      .single();
      
    if (insertError) {
      console.error("Error storing seed phrase:", insertError);
      
      // If there's a conflict (another process might have created it), try to fetch again
      if (insertError.code === '23505') { // Unique violation
        const { data: retryData, error: retryError } = await supabase
          .from('user_mnemonics')
          .select('main_mnemonic')
          .eq('user_id', userId)
          .maybeSingle();
          
        if (retryError) {
          console.error("Error in retry fetch of seed phrase:", retryError);
          throw new Error("Failed to retrieve or create seed phrase");
        }
        
        if (retryData?.main_mnemonic) {
          return retryData.main_mnemonic;
        }
      }
      
      throw new Error(`Failed to store seed phrase: ${insertError.message}`);
    }
    
    return seedPhrase;
  } catch (error) {
    console.error("Error in getOrCreateSeedPhrase:", error);
    throw error;
  }
}

/**
 * Generate HD wallets from seed phrase
 * This is just a re-export for backward compatibility
 */
export async function generateHDWallets(seedPhrase: string, userId: string) {
  // Import the function dynamically to avoid circular dependencies
  const { generateHDWallets: generateWallets } = await import("./hd-wallet-core.ts");
  return generateWallets(seedPhrase, userId);
}
