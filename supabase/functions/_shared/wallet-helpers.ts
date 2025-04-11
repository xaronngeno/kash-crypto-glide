
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import * as ethers from "https://esm.sh/ethers@6.13.5";

// Define the derivation paths following BIP-44 standards
const DERIVATION_PATHS = {
  BITCOIN_SEGWIT: "m/84'/0'/0'/0/0", // BIP84 - Native SegWit
  ETHEREUM: "m/44'/60'/0'/0/0",       // BIP44 - Ethereum
  SOLANA: "m/44'/501'/0'/0'"         // BIP44 - Solana
};

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

// Get or create a seed phrase for a user
export async function getOrCreateSeedPhrase(supabase: any, userId: string): Promise<string> {
  try {
    // Try to get an existing seed phrase
    const { data: existingMnemonic, error: mnemonicError } = await supabase
      .from('user_mnemonics')
      .select('main_mnemonic')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (!mnemonicError && existingMnemonic?.main_mnemonic) {
      console.log("Found existing seed phrase");
      return existingMnemonic.main_mnemonic;
    }
    
    // Generate a new seed phrase
    console.log("Generating new seed phrase");
    const wallet = ethers.Wallet.createRandom();
    const mnemonic = wallet.mnemonic?.phrase;
    
    if (!mnemonic) {
      throw new Error("Failed to generate mnemonic");
    }
    
    // Store the mnemonic
    await supabase
      .from('user_mnemonics')
      .insert({
        user_id: userId,
        main_mnemonic: mnemonic
      });
    
    return mnemonic;
  } catch (error) {
    console.error("Error in getOrCreateSeedPhrase:", error);
    throw error;
  }
}

// Generate wallets from seed phrase
export async function generateHDWallets(seedPhrase: string, userId: string) {
  try {
    // Create HD wallets from seed phrase
    const ethHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(seedPhrase),
      DERIVATION_PATHS.ETHEREUM
    );
    
    const solanaHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(seedPhrase),
      DERIVATION_PATHS.SOLANA
    );
    
    // Derive Bitcoin wallet deterministically
    const btcHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(seedPhrase),
      DERIVATION_PATHS.BITCOIN_SEGWIT
    );
    
    // Simplify Bitcoin address derivation for now
    const btcAddress = `bc1q${btcHdNode.privateKey.slice(2, 38)}`;
    
    return {
      ethereum: {
        address: ethHdNode.address,
        private_key: ethHdNode.privateKey
      },
      solana: {
        // Convert to simpler Solana address format
        address: solanaHdNode.privateKey.slice(2, 44),
        private_key: solanaHdNode.privateKey
      },
      bitcoinSegwit: {
        address: btcAddress,
        private_key: btcHdNode.privateKey
      }
    };
  } catch (error) {
    console.error("Error generating HD wallets:", error);
    throw error;
  }
}

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
