
import { generatePrivateKey, deriveEthAddress, deriveSolAddress } from "./crypto-utils.ts";

// Create Ethereum wallet
export async function createEthereumWallet(userId: string) {
  try {
    const seedPhrase = await generatePrivateKey();
    const address = await deriveEthAddress(seedPhrase);
    
    return {
      address,
      private_key: seedPhrase
    };
  } catch (error) {
    console.error("Error creating Ethereum wallet:", error);
    throw error;
  }
}

// Create Solana wallet
export async function createSolanaWallet(userId: string) {
  try {
    const privateKey = await generatePrivateKey();
    const address = await deriveSolAddress(privateKey);
    
    return {
      address,
      private_key: privateKey
    };
  } catch (error) {
    console.error("Error creating Solana wallet:", error);
    throw error;
  }
}

// Create Base wallet (same as Ethereum)
export async function createBaseWallet(userId: string) {
  // Base uses the same wallet format as Ethereum
  return createEthereumWallet(userId);
}

// Create Bitcoin SegWit wallet
export async function createBitcoinSegWitWallet(userId: string) {
  const privateKey = await generatePrivateKey();
  const address = `bc1q${privateKey.substring(0, 38)}`;
  
  return {
    address,
    private_key: privateKey,
    wallet_type: 'Native SegWit'
  };
}
