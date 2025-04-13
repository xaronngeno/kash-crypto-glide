
import { getOrCreateSeedPhrase } from '../../_shared/wallet-helpers.ts';
import { generateHDWallets } from '../../_shared/hd-wallet-core.ts';

/**
 * Generate HD wallets for a user from their seed phrase
 * This ensures addresses are derived consistently and will work with external wallet apps
 */
export async function generateUserHDWallets(supabase: any, userId: string) {
  try {
    // Get or create a seed phrase for the user
    const seedPhrase = await getOrCreateSeedPhrase(supabase, userId);
    console.log("Got seed phrase for user");
    
    if (!seedPhrase) {
      throw new Error("Failed to obtain a valid seed phrase");
    }
    
    // Generate HD wallets from the seed phrase using correct derivation paths
    const hdWallets = await generateHDWallets(seedPhrase, userId);
    console.log("Generated HD wallets successfully");
    
    return {
      solana: {
        address: hdWallets.solana.address,
        private_key: hdWallets.solana.privateKey
      },
      ethereum: hdWallets.ethereum,
      bitcoinSegwit: hdWallets.bitcoinSegwit
    };
  } catch (error) {
    console.error("Error generating HD wallets:", error);
    throw error;
  }
}

// Helper function to verify Solana address
function verifySolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}
