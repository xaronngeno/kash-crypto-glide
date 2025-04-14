
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

/**
 * Helper function to safely insert wallet into database
 */
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
    console.log(`Inserting ${blockchain} ${currency} wallet for user ${userId.substring(0, 8)}...`);
    
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
      // Check if this is a duplicate wallet error
      if (error.code === '23505') { // Unique violation code
        console.log(`Wallet for ${blockchain} ${currency} already exists, skipping insert`);
        return; // Return silently for duplicate keys
      }
      
      console.error(`Error inserting ${blockchain} ${currency} wallet:`, error);
      throw error;
    } else {
      console.log(`Successfully inserted ${blockchain} ${currency} wallet`);
    }
  } catch (err) {
    console.error(`Error in insertWalletIntoDb for ${blockchain} ${currency}:`, err);
    throw err;
  }
}
