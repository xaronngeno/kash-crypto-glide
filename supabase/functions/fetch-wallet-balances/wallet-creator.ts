
import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { generateUserHDWallets } from './utils/hd-wallet-utils.ts';
import { 
  createEthereumWallets, 
  createSolanaWallets, 
  createBitcoinWallet 
} from './utils/wallet-db-ops.ts';
import { ensureUserProfile } from './utils/profile-utils.ts';
import { createMissingWallets } from './create-missing-wallets.ts';

/**
 * Create all required wallets for a new user using HD derivation from a seed phrase
 */
export async function createInitialWallets(supabase: any, userId: string) {
  console.log("Creating wallets directly in fetch-wallet-balances");
  
  try {
    // Ensure the user profile exists
    await ensureUserProfile(supabase, userId);
  
    // Generate HD wallets from the seed phrase
    const hdWallets = await generateUserHDWallets(supabase, userId);
    
    const wallets = [];
    
    // Create Ethereum wallet and tokens
    const ethereumWallets = await createEthereumWallets(
      supabase, 
      userId,
      hdWallets.ethereum.address, 
      hdWallets.ethereum.private_key
    );
    wallets.push(...ethereumWallets);
    
    // Create Solana wallet and tokens
    const solanaWallets = await createSolanaWallets(
      supabase, 
      userId,
      hdWallets.solana.address, 
      hdWallets.solana.private_key
    );
    wallets.push(...solanaWallets);
    
    // Create Bitcoin SegWit wallet
    const bitcoinWallet = await createBitcoinWallet(
      supabase, 
      userId,
      hdWallets.bitcoinSegwit.address, 
      hdWallets.bitcoinSegwit.private_key
    );
    wallets.push(bitcoinWallet);
    
    console.log("Created wallets directly with proper HD derivation");
    
    return wallets;
  } catch (error) {
    console.error('Error in wallet creation:', error);
    throw error;
  }
}

// Re-export createMissingWallets for use by other modules
export { createMissingWallets };
