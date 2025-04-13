
import { generateUserHDWallets } from './utils/hd-wallet-utils.ts';
import { insertWalletIntoDb } from './utils/wallet-insert.ts';
import { ensureUserProfile } from './utils/profile-utils.ts';

/**
 * Create missing wallets for a user that already has some wallets
 */
export async function createMissingWallets(
  supabase: any, 
  userId: string, 
  hasSol: boolean, 
  hasUsdtSol: boolean, 
  hasBtcSegwit: boolean
) {
  console.log("Adding missing wallets");
  const addedWallets = [];
  
  try {
    // First ensure user profile exists
    await ensureUserProfile(supabase, userId);

    // Generate HD wallets to ensure consistent addresses
    const hdWallets = await generateUserHDWallets(supabase, userId);
    
    if (!hasSol) {
      await insertWalletIntoDb(
        supabase, 
        userId, 
        'Solana', 
        'SOL', 
        hdWallets.solana.address, 
        hdWallets.solana.private_key, 
        'imported'
      );
      
      addedWallets.push({
        blockchain: 'Solana',
        currency: 'SOL',
        address: hdWallets.solana.address,
        balance: 0,
        wallet_type: 'imported'
      });
    }
    
    if (!hasBtcSegwit) {
      await insertWalletIntoDb(
        supabase, 
        userId, 
        'Bitcoin', 
        'BTC', 
        hdWallets.bitcoinSegwit.address, 
        hdWallets.bitcoinSegwit.private_key, 
        'Native SegWit'
      );
      
      addedWallets.push({
        blockchain: 'Bitcoin',
        currency: 'BTC',
        address: hdWallets.bitcoinSegwit.address,
        balance: 0,
        wallet_type: 'Native SegWit'
      });
    }
    
    return addedWallets;
  } catch (err) {
    console.error("Error creating missing wallets:", err);
    return [];
  }
}
