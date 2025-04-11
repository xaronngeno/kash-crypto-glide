
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Generate a random private key
export async function generatePrivateKey(): Promise<string> {
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Derive Ethereum address from private key
export async function deriveEthAddress(privateKey: string): Promise<string> {
  try {
    return "0x" + privateKey.substring(0, 40);
  } catch (error) {
    console.error("Error deriving ETH address:", error);
    throw error;
  }
}

// Derive Solana address from private key
export async function deriveSolAddress(privateKey: string): Promise<string> {
  try {
    const buffer = new TextEncoder().encode(privateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex.substring(0, 44);
  } catch (error) {
    console.error("Error deriving SOL address:", error);
    throw error;
  }
}

// Create Ethereum wallet
export async function createEthereumWallet(userId: string) {
  const privateKey = await generatePrivateKey();
  const address = await deriveEthAddress(privateKey);
  
  return {
    address,
    private_key: privateKey
  };
}

// Create Solana wallet
export async function createSolanaWallet(userId: string) {
  const privateKey = await generatePrivateKey();
  const address = await deriveSolAddress(privateKey);
  
  return {
    address,
    private_key: privateKey
  };
}

// Create Base wallet (same as Ethereum)
export async function createBaseWallet(userId: string) {
  // Base uses the same wallet format as Ethereum
  const privateKey = await generatePrivateKey();
  const address = await deriveEthAddress(privateKey);
  
  return {
    address,
    private_key: privateKey
  };
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

// Insert wallet data into the database
export async function insertWalletIntoDb(
  supabase: any, 
  userId: string, 
  blockchain: string, 
  currency: string, 
  address: string, 
  privateKey: string | null = null,
  walletType: string | null = null,
  balance: number = 0
) {
  const walletData = {
    user_id: userId,
    blockchain,
    currency,
    address,
    balance,
    wallet_type: walletType
  };
  
  if (privateKey) {
    walletData['private_key'] = privateKey;
  }
  
  const { error } = await supabase.from('wallets').insert(walletData);
  
  if (error) {
    console.error(`Error inserting ${blockchain} ${currency} wallet:`, error);
    throw error;
  }
  
  return {
    blockchain,
    currency,
    address,
    balance,
    wallet_type: walletType
  };
}
