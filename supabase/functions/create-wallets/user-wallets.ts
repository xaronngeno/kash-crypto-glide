
import { base58_encode } from "https://esm.sh/bs58@5.0.0/index.js";
import { encryptPrivateKey } from "./encryption.ts";
import { generateHDWallets } from "../_shared/wallet-helpers.ts";

// Create wallet addresses for a user
export async function createUserWallets(supabase: any, userId: string) {
  try {
    console.log(`Creating wallets for user: ${userId}`);
    
    // Check if user already has wallets to prevent duplicates
    const { data: existingWalletsCheck, error: existingWalletsError } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
      
    if (existingWalletsError) {
      console.error("Error checking existing wallets:", existingWalletsError);
    } else if (existingWalletsCheck && existingWalletsCheck.length > 0) {
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
    
    // Get user profile to check numeric ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("numeric_id")
      .eq("id", userId)
      .single();
      
    if (profileError) {
      throw new Error(`Error fetching user profile: ${profileError.message}`);
    }
    
    if (!profile || !profile.numeric_id) {
      // Assign a numeric ID if not already present
      let numeric_id;
      let idUnique = false;
      
      // Try up to 10 times to generate a unique ID
      for (let attempts = 0; attempts < 10 && !idUnique; attempts++) {
        numeric_id = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
        
        // Check if this ID already exists
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
      
      // Update the profile with the new numeric ID
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ numeric_id })
        .eq('id', userId);
        
      if (updateError) {
        throw new Error(`Error updating user's numeric ID: ${updateError.message}`);
      }
      
      console.log(`Assigned numeric ID ${numeric_id} to user ${userId}`);
    }
    
    // Check if user already has wallets
    const { data: existingWallets, error: checkError } = await supabase
      .from("wallets")
      .select("currency, blockchain, wallet_type")
      .eq("user_id", userId);

    if (checkError) {
      throw new Error(`Error checking existing wallets: ${checkError.message}`);
    }

    // Create an object to keep track of which wallets exist
    const existingWalletKeys = new Set();
    if (existingWallets && existingWallets.length > 0) {
      console.log(`User ${userId} already has ${existingWallets.length} wallets`);
      
      // Track existing wallet combinations
      existingWallets.forEach(wallet => {
        const key = wallet.wallet_type 
          ? `${wallet.blockchain}-${wallet.currency}-${wallet.wallet_type}`
          : `${wallet.blockchain}-${wallet.currency}`;
        existingWalletKeys.add(key);
      });
    }

    // Generate HD wallets from a single seed phrase
    const hdWallets = await generateHDWallets(userId);
    
    // Check if there's already a mnemonic saved to prevent duplicates
    const { data: existingMnemonic, error: mnemonicCheckError } = await supabase
      .from('user_mnemonics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (mnemonicCheckError) {
      console.error("Error checking existing mnemonic:", mnemonicCheckError);
    }
    
    // Only store seed phrase if it doesn't exist
    if (!existingMnemonic) {
      // Store the mnemonic
      const { error: mnemonicError } = await supabase
        .from('user_mnemonics')
        .insert({
          user_id: userId,
          main_mnemonic: hdWallets.mnemonic
        });
        
      if (mnemonicError) {
        console.error("Error storing mnemonic:", mnemonicError);
      } else {
        console.log("Stored seed phrase successfully");
      }
    }

    // Create wallet objects to insert - only create what's needed
    const wallets = [];

    // 1. Create Bitcoin wallet if it doesn't exist - ONLY SegWit
    if (!existingWalletKeys.has("Bitcoin-BTC-Native SegWit")) {
      try {
        console.log("Creating Bitcoin SegWit wallet");
        // Use await with encryptPrivateKey since it now returns a Promise
        const encryptedBtcKey = await Promise.resolve(encryptPrivateKey(hdWallets.bitcoinSegwit.privateKey, userId));
        
        wallets.push({
          user_id: userId,
          blockchain: "Bitcoin",
          currency: "BTC",
          address: hdWallets.bitcoinSegwit.address,
          private_key: encryptedBtcKey,
          wallet_type: "Native SegWit",
          balance: 0, // Start with zero balance
        });
        console.log("Created BTC SegWit wallet");
      } catch (btcError) {
        console.error("Error creating BTC SegWit wallet:", btcError);
      }
    }

    // 2. Create Ethereum wallet if it doesn't exist
    if (!existingWalletKeys.has("Ethereum-ETH")) {
      try {
        console.log("Creating ETH wallet");
        // Use await with encryptPrivateKey since it now returns a Promise
        const encryptedEthKey = await Promise.resolve(encryptPrivateKey(hdWallets.ethereum.privateKey, userId));
        
        wallets.push({
          user_id: userId,
          blockchain: "Ethereum",
          currency: "ETH",
          address: hdWallets.ethereum.address,
          private_key: encryptedEthKey,
          wallet_type: "imported",
          balance: 0,
        });
        console.log("Created ETH wallet");
      } catch (ethError) {
        console.error("Error creating ETH wallet:", ethError);
      }
    }

    // 3. Create Solana wallet if it doesn't exist
    if (!existingWalletKeys.has("Solana-SOL")) {
      try {
        console.log("Creating Solana wallet");
        // Use await with encryptPrivateKey since it now returns a Promise
        const encryptedSolKey = await Promise.resolve(encryptPrivateKey(hdWallets.solana.privateKey, userId));
        
        wallets.push({
          user_id: userId,
          blockchain: "Solana",
          currency: "SOL",
          address: hdWallets.solana.address,
          private_key: encryptedSolKey,
          wallet_type: "imported",
          balance: 0,
        });
        console.log("Created SOL wallet");
      } catch (solError) {
        console.error("Error creating SOL wallet:", solError);
      }
    }

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
