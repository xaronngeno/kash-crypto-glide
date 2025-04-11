import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0";
import { encryptPrivateKey } from "../_shared/encryption-utils.ts";
import { generateHDWallets } from "./wallet-generator.ts";

/**
 * Create wallet addresses for a user
 */
export async function createUserWallets(supabase: any, userId: string) {
  try {
    console.log(`Creating wallets for user: ${userId}`);
    
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
    const hdWallets = generateHDWallets(userId);
    
    // Store the seed phrase in the user_mnemonics table
    const { data: existingMnemonic, error: mnemonicCheckError } = await supabase
      .from('user_mnemonics')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (mnemonicCheckError) {
      console.error("Error checking existing mnemonic:", mnemonicCheckError);
    }
    
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

    return await createWalletsFromHDWallet(supabase, userId, hdWallets, existingWalletKeys, existingWallets);
  } catch (error) {
    console.error("Error in createUserWallets function:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create wallet records from HD wallet data
 */
async function createWalletsFromHDWallet(
  supabase: any,
  userId: string,
  hdWallets: any,
  existingWalletKeys: Set<string>,
  existingWallets: any[] | null
) {
  // Create wallet objects to insert
  const wallets = [];

  // 1. Create Bitcoin wallets if they don't exist
  if (!existingWalletKeys.has("Bitcoin-BTC-Taproot")) {
    try {
      console.log("Creating Bitcoin Taproot wallet");
      wallets.push({
        user_id: userId,
        blockchain: "Bitcoin",
        currency: "BTC",
        address: hdWallets.bitcoinTaproot.address,
        private_key: encryptPrivateKey(hdWallets.bitcoinTaproot.privateKey, userId),
        wallet_type: "Taproot",
        balance: 0, // Start with zero balance
      });
      console.log("Created BTC Taproot wallet");
    } catch (btcError) {
      console.error("Error creating BTC Taproot wallet:", btcError);
    }
  }

  if (!existingWalletKeys.has("Bitcoin-BTC-Native SegWit")) {
    try {
      console.log("Creating Bitcoin SegWit wallet");
      wallets.push({
        user_id: userId,
        blockchain: "Bitcoin",
        currency: "BTC",
        address: hdWallets.bitcoinSegwit.address,
        private_key: encryptPrivateKey(hdWallets.bitcoinSegwit.privateKey, userId),
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
      wallets.push({
        user_id: userId,
        blockchain: "Ethereum",
        currency: "ETH",
        address: hdWallets.ethereum.address,
        private_key: encryptPrivateKey(hdWallets.ethereum.privateKey, userId),
        wallet_type: "imported",
        balance: 0,
      });
      
      // Also create USDT wallet on Ethereum with the same address if it doesn't exist
      if (!existingWalletKeys.has("Ethereum-USDT")) {
        wallets.push({
          user_id: userId,
          blockchain: "Ethereum",
          currency: "USDT",
          address: hdWallets.ethereum.address,
          private_key: null,
          wallet_type: "token",
          balance: 0,
        });
      }
      console.log("Created ETH and USDT (ERC20) wallets");
    } catch (ethError) {
      console.error("Error creating ETH wallet:", ethError);
    }
  }

  // 3. Create Solana wallet if it doesn't exist
  if (!existingWalletKeys.has("Solana-SOL")) {
    try {
      console.log("Creating Solana wallet");
      wallets.push({
        user_id: userId,
        blockchain: "Solana",
        currency: "SOL",
        address: hdWallets.solana.address,
        private_key: encryptPrivateKey(hdWallets.solana.privateKey, userId),
        wallet_type: "imported",
        balance: 0,
      });
      
      // Add USDT on Solana (SPL token) if it doesn't exist
      if (!existingWalletKeys.has("Solana-USDT")) {
        wallets.push({
          user_id: userId,
          blockchain: "Solana",
          currency: "USDT",
          address: hdWallets.solana.address,
          private_key: null,
          wallet_type: "token",
          balance: 0,
        });
      }
      console.log("Created SOL wallet and USDT (SPL) wallet");
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
}
