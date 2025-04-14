
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import { getOrCreateSeedPhrase } from '../../_shared/wallet-helpers.ts';
import { Keypair } from 'https://esm.sh/@solana/web3.js@1.91.1';
import * as bip39 from 'https://esm.sh/bip39@3.1.0';
import { derivePath } from 'https://esm.sh/ed25519-hd-key@1.3.0';
import { 
  deriveEthereumWallet, 
  deriveBitcoinWallet, 
  createSolanaWallet 
} from '../../_shared/key-derivation.ts';

/**
 * Generate HD wallets for a user from their seed phrase
 * This ensures addresses are derived consistently with the following standards:
 * SOL: m/44'/501'/0'/0' (ed25519)
 * ETH: m/44'/60'/0'/0/0 (secp256k1)
 * BTC: m/44'/0'/0'/0/0 (secp256k1)
 */
export async function generateUserHDWallets(supabase: any, userId: string) {
  try {
    // Get or create a seed phrase for the user
    const seedPhrase = await getOrCreateSeedPhrase(supabase, userId);
    console.log("Got seed phrase for user");
    
    if (!seedPhrase) {
      throw new Error("Failed to obtain a valid seed phrase");
    }
    
    try {
      // Generate Ethereum wallet from seed phrase
      const ethereum = await deriveEthereumWallet(seedPhrase);
      
      // Generate Bitcoin wallet from seed phrase
      const bitcoin = await deriveBitcoinWallet(seedPhrase);
      
      // Special handling for Solana wallet
      let solana;
      try {
        // Try to generate Solana address using the standard derivation path
        const seed = await bip39.mnemonicToSeed(seedPhrase);
        const { key } = derivePath("m/44'/501'/0'/0'", Buffer.from(seed).toString('hex'));
        
        // Create keypair from the derived seed
        const keypair = Keypair.fromSeed(Uint8Array.from(key.slice(0, 32)));
        
        solana = {
          address: keypair.publicKey.toString(),
          privateKey: Buffer.from(keypair.secretKey).toString('hex')
        };
        console.log("Generated Solana wallet with proper derivation");
      } catch (solError) {
        console.error("Error deriving Solana wallet from seed phrase:", solError);
        
        // Fallback to alternative generation
        console.log("Using fallback Solana wallet generation");
        const fallbackWallet = await createSolanaWallet(seedPhrase);
        
        solana = {
          address: fallbackWallet.address,
          privateKey: fallbackWallet.private_key
        };
      }
      
      return {
        solana: {
          address: solana.address,
          private_key: solana.privateKey
        },
        ethereum,
        bitcoin,
        bitcoinSegwit: bitcoin // For compatibility
      };
    } catch (error) {
      console.error("Error generating HD wallets:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in generateUserHDWallets:", error);
    throw error;
  }
}

// Helper function to verify Solana address
export function verifySolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  
  // Solana addresses should be base58 encoded and typically 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  // Check if it's in the right format
  return base58Regex.test(address);
}
