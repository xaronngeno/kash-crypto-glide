/**
 * Check if a user has existing wallets
 */
export async function checkExistingWallets(supabase: any, userId: string): Promise<{
  existingWallets: any[] | null;
  existingWalletKeys: Set<string>;
}> {
  try {
    // Check if user already has wallets
    const { data: existingWallets, error: checkError } = await supabase
      .from("wallets")
      .select("currency, blockchain, wallet_type, address")
      .eq("user_id", userId);

    if (checkError) {
      throw new Error(`Error checking existing wallets: ${checkError.message}`);
    }

    // Create an object to keep track of which wallets exist
    const existingWalletKeys = new Set<string>();
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
    
    return { existingWallets, existingWalletKeys };
  } catch (error) {
    console.error("Error checking existing wallets:", error);
    throw error;
  }
}

/**
 * Quick check if user has any wallets at all
 */
export async function userHasAnyWallets(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: existingWalletsCheck, error: existingWalletsError } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", userId)
      .limit(1);
      
    if (existingWalletsError) {
      console.error("Error checking existing wallets:", existingWalletsError);
      return false;
    }
    
    return existingWalletsCheck && existingWalletsCheck.length > 0;
  } catch (error) {
    console.error("Error checking if user has wallets:", error);
    return false;
  }
}
