
import { getOrCreateSeedPhrase } from "../_shared/wallet-helpers.ts";
import { generateHDWallets } from "../_shared/hd-wallet-core.ts";
import { checkExistingWallets, userHasAnyWallets } from "./wallet-checker.ts";
import { ensureUserHasNumericId } from "./profile-manager.ts";
import { manageUserMnemonic } from "./mnemonic-handler.ts";
import { generateWalletObjects } from "./wallet-creator.ts";

// Create wallet addresses for a user
export async function createUserWallets(supabase: any, userId: string) {
  try {
    console.log(`Creating wallets for user: ${userId}`);
    
    // Check if user already has wallets to prevent duplicates
    const hasWallets = await userHasAnyWallets(supabase, userId);
    if (hasWallets) {
      console.log(`User ${userId} already has wallets, skipping creation`);
      
      // Return existing wallets instead of creating new ones
      const { data: userWallets, error: walletsError } = await supabase
        .from("wallets")
        .select("blockchain, currency, address, wallet_type")
        .eq("user_id", userId);
        
      if (walletsError) {
        console.error("Error fetching existing wallets:", walletsError);
      } else {
        return {
          success: true,
          message: "Using existing wallets",
          count: userWallets.length,
          wallets: userWallets
        };
      }
    }
    
    // Ensure user has a numeric ID
    await ensureUserHasNumericId(supabase, userId);
    
    // Check existing wallets to avoid duplicates
    const { existingWallets, existingWalletKeys } = await checkExistingWallets(supabase, userId);

    // Get or generate seed phrase
    const mnemonic = await getOrCreateSeedPhrase(supabase, userId);
    
    try {
      // Generate HD wallets from the seed phrase
      const hdWallets = await generateHDWallets(mnemonic, userId);
      
      // Store or retrieve seed phrase
      await manageUserMnemonic(supabase, userId, hdWallets.mnemonic);
  
      // Create wallet objects to insert - only create what's needed
      const wallets = await generateWalletObjects(userId, hdWallets, existingWalletKeys);
  
      // Insert wallets into database if there are any to insert
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
          wallets: insertedWallets,
          seedPhrase: hdWallets.mnemonic
        };
      } else if (existingWallets && existingWallets.length > 0) {
        // If no new wallets were created but some exist, return the existing ones
        // Check if there's an existing mnemonic to return
        const { data: mnemonicData } = await supabase
          .from('user_mnemonics')
          .select('main_mnemonic')
          .eq('user_id', userId)
          .maybeSingle();
        
        return { 
          success: true, 
          message: "Wallets already exist", 
          count: 0,
          existingCount: existingWallets.length,
          wallets: existingWallets,
          seedPhrase: mnemonicData?.main_mnemonic
        };
      } else {
        throw new Error("No wallets were created");
      }
    } catch (error) {
      console.error("Error generating HD wallets:", error);
      
      // Return a friendly error message
      return { 
        success: false, 
        error: `Wallet generation failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  } catch (error) {
    console.error("Error in createUserWallets function:", error);
    return { success: false, error: error.message };
  }
}
