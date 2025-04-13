
import { generateHDWallets } from "../_shared/wallet-helpers.ts";
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

    // Generate HD wallets from a single seed phrase
    const hdWallets = await generateHDWallets(userId);
    
    // Store or retrieve seed phrase
    const storedMnemonic = await manageUserMnemonic(supabase, userId, hdWallets.mnemonic);

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
    console.error("Error in createUserWallets function:", error);
    return { success: false, error: error.message };
  }
}

// Variable to store seed phrase
let seedPhrase: string | undefined;

// Function to get or create seed phrase
export async function getOrCreateSeedPhrase(userId: string): Promise<string> {
  if (seedPhrase) {
    return seedPhrase;
  }
  
  // In a real implementation, you would attempt to fetch the user's stored seed phrase
  // If none exists, generate a new one
  seedPhrase = "example seed phrase for testing only";
  return seedPhrase;
}
