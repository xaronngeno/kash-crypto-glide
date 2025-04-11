
import { getOrCreateSeedPhrase, generateHDWallets } from '../../_shared/wallet-helpers.ts';

/**
 * Generate HD wallets for a user from their seed phrase
 * This ensures addresses are derived consistently and will work with external wallet apps
 */
export async function generateUserHDWallets(supabase: any, userId: string) {
  // Get or create a seed phrase for the user
  const seedPhrase = await getOrCreateSeedPhrase(supabase, userId);
  console.log("Got seed phrase for user");
  
  // Generate HD wallets from the seed phrase
  const hdWallets = await generateHDWallets(seedPhrase, userId);
  
  return hdWallets;
}
