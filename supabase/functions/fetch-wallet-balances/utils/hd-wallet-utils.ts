
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
  
  // Validate the HD wallets to ensure they were properly generated
  if (!hdWallets.solana || !hdWallets.solana.address || !verifySolanaAddress(hdWallets.solana.address)) {
    console.error("Invalid Solana wallet generated from HD wallet process");
    throw new Error("Failed to generate valid Solana wallet");
  }
  
  console.log("Generated valid HD wallets with addresses:");
  console.log("- Solana:", hdWallets.solana.address);
  console.log("- Ethereum:", hdWallets.ethereum.address);
  console.log("- Bitcoin:", hdWallets.bitcoinSegwit.address);
  
  return hdWallets;
}

// Helper function to verify Solana address
function verifySolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}
