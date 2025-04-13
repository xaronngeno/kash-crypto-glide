
/**
 * Retrieve or store a seed phrase for a user
 * With improved conflict handling
 */
export async function manageUserMnemonic(supabase: any, userId: string, seedPhrase: string | undefined): Promise<string | undefined> {
  try {
    // Check if there's already a mnemonic saved to prevent duplicates
    const { data: existingMnemonic, error: mnemonicCheckError } = await supabase
      .from('user_mnemonics')
      .select('main_mnemonic')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (mnemonicCheckError) {
      console.error("Error checking existing mnemonic:", mnemonicCheckError);
    }
    
    if (existingMnemonic?.main_mnemonic) {
      console.log("Found existing mnemonic for user, returning it");
      return existingMnemonic.main_mnemonic;
    }
    
    // Only store seed phrase if it doesn't exist and we have one to store
    if (seedPhrase) {
      // Use upsert with onConflict to handle potential race conditions
      const { data: inserted, error: mnemonicError } = await supabase
        .from('user_mnemonics')
        .upsert({
          user_id: userId,
          main_mnemonic: seedPhrase
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: true
        })
        .select();
        
      if (mnemonicError) {
        console.error("Error storing mnemonic:", mnemonicError);
      } else {
        console.log("Stored seed phrase successfully");
        return seedPhrase;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error("Error managing mnemonic:", error);
    return undefined;
  }
}
