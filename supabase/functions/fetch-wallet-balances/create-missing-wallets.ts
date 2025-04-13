
import { createEthereumWallets, createSolanaWallets, createBitcoinWallet } from './utils/wallet-db-ops.ts';
import { generateUserHDWallets } from './utils/hd-wallet-utils.ts';

/**
 * Create any missing wallets for a user if they don't have the complete set
 */
export async function createMissingWallets(
  supabase: any,
  userId: string,
  hasSol: boolean,
  hasEth: boolean,
  hasBtcSegwit: boolean
) {
  try {
    console.log(`Creating missing wallets for user: ${userId}`);
    console.log(`Current wallet status - SOL: ${hasSol}, ETH: ${hasEth}, BTC SegWit: ${hasBtcSegwit}`);
    
    // If user has all wallets, nothing to do
    if (hasSol && hasEth && hasBtcSegwit) {
      console.log("User already has all required wallet types");
      return [];
    }
    
    // Generate HD wallets from the seed phrase
    const hdWallets = await generateUserHDWallets(supabase, userId);
    const createdWallets = [];
    
    // Only create wallets that don't exist yet
    if (!hasEth) {
      console.log("Creating missing Ethereum wallet");
      const ethWallets = await createEthereumWallets(
        supabase, 
        userId,
        hdWallets.ethereum.address, 
        hdWallets.ethereum.private_key
      );
      createdWallets.push(...ethWallets);
    }
    
    if (!hasSol) {
      console.log("Creating missing Solana wallet");
      const solWallets = await createSolanaWallets(
        supabase, 
        userId,
        hdWallets.solana.address, 
        hdWallets.solana.private_key
      );
      createdWallets.push(...solWallets);
    }
    
    if (!hasBtcSegwit) {
      console.log("Creating missing Bitcoin SegWit wallet");
      const btcWallet = await createBitcoinWallet(
        supabase, 
        userId,
        hdWallets.bitcoinSegwit.address, 
        hdWallets.bitcoinSegwit.private_key
      );
      createdWallets.push(btcWallet);
    }
    
    console.log(`Created ${createdWallets.length} missing wallets`);
    return createdWallets;
  } catch (error) {
    console.error('Error creating missing wallets:', error);
    return [];
  }
}
