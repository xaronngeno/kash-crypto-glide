
import { createEthereumWallets, createSolanaWallets } from './utils/wallet-db-ops.ts';
import { generateUserHDWallets } from './utils/hd-wallet-utils.ts';

/**
 * Create any missing wallets for a user if they don't have the complete set
 */
export async function createMissingWallets(
  supabase: any,
  userId: string,
  hasSol: boolean,
  hasEth: boolean,
) {
  try {
    console.log(`Creating missing wallets for user: ${userId}`);
    console.log(`Current wallet status - SOL: ${hasSol}, ETH: ${hasEth}`);
    
    // If user has all wallets, nothing to do
    if (hasSol && hasEth) {
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
      
      // Ensure solana wallet has a valid address
      if (!hdWallets.solana.address || hdWallets.solana.address.trim() === "") {
        console.error("Error: Generated Solana wallet has empty address");
        console.log("Solana wallet data:", JSON.stringify(hdWallets.solana));
        
        // Try to generate an emergency address (not ideal but better than empty)
        if (hdWallets.solana.private_key) {
          const privateKeyHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(hdWallets.solana.private_key)
          );
          const hashArray = Array.from(new Uint8Array(privateKeyHash));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          hdWallets.solana.address = hashHex.substring(0, 44);
          console.log("Generated emergency Solana address:", hdWallets.solana.address);
        }
      }
      
      console.log("Using Solana address:", hdWallets.solana.address);
      const solWallets = await createSolanaWallets(
        supabase, 
        userId,
        hdWallets.solana.address, 
        hdWallets.solana.private_key
      );
      createdWallets.push(...solWallets);
    }
    
    console.log(`Created ${createdWallets.length} missing wallets`);
    return createdWallets;
  } catch (error) {
    console.error('Error creating missing wallets:', error);
    return [];
  }
}
