
import { encryptPrivateKey } from "./encryption.ts";
import { generateHDWallets } from "../_shared/wallet-helpers.ts";

/**
 * Generate wallet objects for a user from seed phrase
 */
export async function generateWalletObjects(userId: string, hdWallets: any, existingWalletKeys: Set<string>) {
  const wallets = [];
  
  // Create Ethereum wallet if it doesn't exist
  if (!existingWalletKeys.has("Ethereum-ETH")) {
    try {
      console.log("Creating ETH wallet");
      // Use await with encryptPrivateKey since it now returns a Promise
      const encryptedEthKey = await Promise.resolve(encryptPrivateKey(hdWallets.ethereum.privateKey, userId));
      
      wallets.push({
        user_id: userId,
        blockchain: "Ethereum",
        currency: "ETH",
        address: hdWallets.ethereum.address,
        private_key: encryptedEthKey,
        wallet_type: "imported",
        balance: 0,
      });
      console.log("Created ETH wallet");
    } catch (ethError) {
      console.error("Error creating ETH wallet:", ethError);
    }
  }

  // Create Solana wallet if it doesn't exist
  if (!existingWalletKeys.has("Solana-SOL")) {
    try {
      console.log("Creating Solana wallet");
      // Use await with encryptPrivateKey since it now returns a Promise
      const encryptedSolKey = await Promise.resolve(encryptPrivateKey(hdWallets.solana.privateKey, userId));
      
      wallets.push({
        user_id: userId,
        blockchain: "Solana",
        currency: "SOL",
        address: hdWallets.solana.address,
        private_key: encryptedSolKey,
        wallet_type: "imported",
        balance: 0,
      });
      console.log("Created SOL wallet");
    } catch (solError) {
      console.error("Error creating SOL wallet:", solError);
    }
  }
  
  return wallets;
}
