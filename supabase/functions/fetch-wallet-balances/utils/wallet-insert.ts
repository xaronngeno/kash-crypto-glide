
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
    } else {
      console.log(`Successfully inserted ${blockchain} ${currency} wallet`);
    }
  } catch (err) {
    console.error(`Error in insertWalletIntoDb for ${blockchain} ${currency}:`, err);
  }
}
