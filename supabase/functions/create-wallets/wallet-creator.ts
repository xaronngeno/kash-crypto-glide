
import { encryptPrivateKey } from "./encryption.ts";
import { generateHDWallets } from "../_shared/wallet-helpers.ts";

/**
 * Generate wallet objects for a user from seed phrase
 */
export async function generateWalletObjects(userId: string, hdWallets: any, existingWalletKeys: Set<string>) {
  const wallets = [];
  
  // 1. Create Bitcoin wallet if it doesn't exist - ONLY SegWit
  if (!existingWalletKeys.has("Bitcoin-BTC-Native SegWit")) {
    try {
      console.log("Creating Bitcoin SegWit wallet");
      // Use await with encryptPrivateKey since it now returns a Promise
      const encryptedBtcKey = await Promise.resolve(encryptPrivateKey(hdWallets.bitcoinSegwit.privateKey, userId));
      
      wallets.push({
        user_id: userId,
        blockchain: "Bitcoin",
        currency: "BTC",
        address: hdWallets.bitcoinSegwit.address,
        private_key: encryptedBtcKey,
        wallet_type: "Native SegWit",
        balance: 0, // Start with zero balance
      });
      console.log("Created BTC SegWit wallet");
    } catch (btcError) {
      console.error("Error creating BTC SegWit wallet:", btcError);
    }
  }

  // 2. Create Ethereum wallet if it doesn't exist
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

  // 3. Create Solana wallet if it doesn't exist
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
