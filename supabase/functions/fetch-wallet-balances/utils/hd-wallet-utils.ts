
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
    
    // Generate HD wallets from the seed phrase
    const hdWallets = await generateHDWallets(seedPhrase, userId);
    
    // Create placeholder Solana address that will be replaced by frontend
    const solanaWallet = {
      address: "PLACEHOLDER_SOLANA_ADDRESS", // Will be replaced on frontend with actual derivation
      private_key: hdWallets.solana.privateKey
    };
    
    const wallets = {
      solana: solanaWallet,
      ethereum: hdWallets.ethereum,
      bitcoinSegwit: hdWallets.bitcoinSegwit
    };
    
    console.log("Generated HD wallets with addresses:");
    console.log("- Ethereum:", hdWallets.ethereum.address);
    console.log("- Bitcoin:", hdWallets.bitcoinSegwit.address);
    
    return wallets;
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
