
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Insert a wallet record into the database with error handling
export async function insertWalletIntoDb(
  supabase: any,
  userId: string, 
  blockchain: string, 
  currency: string,
  address: string, 
  privateKey: string | null,
  walletType: string
) {
  try {
    // First ensure the user profile exists
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError) {
      console.error("Error checking user profile before wallet insert:", profileError);
      throw new Error(`Profile check failed: ${profileError.message}`);
    }
    
    // If user profile doesn't exist, create one
    if (!userProfile) {
      console.log(`No profile found for user ${userId}, creating one`);
      
      // Get user info from auth if possible
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      // Create a new profile
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: authUser?.user?.email || null,
          numeric_id: Math.floor(Math.random() * 89999999) + 10000000
        });
        
      if (insertError) {
        console.error("Failed to create user profile:", insertError);
        throw new Error(`Profile creation failed: ${insertError.message}`);
      }
      
      console.log("Created new user profile for wallet insertion");
    }
  
    // Now insert the wallet
    const { error } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        blockchain: blockchain,
        currency: currency, 
        address: address,
        private_key: privateKey,
        wallet_type: walletType,
        balance: 0
      });
      
    if (error) {
      console.error(`Error inserting ${blockchain} ${currency} wallet:`, error);
      throw new Error(`Wallet insertion failed: ${error.message}`);
    } else {
      console.log(`Successfully inserted ${blockchain} ${currency} wallet`);
    }
  } catch (err) {
    console.error(`Error in insertWalletIntoDb for ${blockchain} ${currency}:`, err);
    throw err;
  }
}
