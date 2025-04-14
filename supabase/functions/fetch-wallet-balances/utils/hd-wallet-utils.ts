
import { getOrCreateSeedPhrase } from '../../_shared/wallet-helpers.ts';
import { generateHDWallets } from '../../_shared/hd-wallet-core.ts';
import { derivePath } from 'https://esm.sh/ed25519-hd-key@1.3.0';
import * as bip39 from 'https://esm.sh/bip39@3.1.0';

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
    console.log("Generated HD wallets", {
      hasEthereumAddress: Boolean(hdWallets.ethereum?.address),
      hasBitcoinAddress: Boolean(hdWallets.bitcoinSegwit?.address),
      hasSolanaAddress: Boolean(hdWallets.solana?.address)
    });
    
    // Verify that the Solana address is valid
    if (!hdWallets.solana.address || hdWallets.solana.address.trim() === "" || 
        !verifySolanaAddress(hdWallets.solana.address)) {
      console.warn("Generated Solana address may be invalid or missing:", hdWallets.solana.address);
      
      // Attempt to regenerate the Solana address directly using ed25519-hd-key
      try {
        console.log("Attempting to regenerate Solana address with direct ed25519 derivation");
        
        // Convert seed phrase to seed
        const seed = await bip39.mnemonicToSeed(seedPhrase);
        
        // Derive key using Solana path
        const path = "m/44'/501'/0'/0'";
        const { key } = derivePath(path, Buffer.from(seed).toString('hex'));
        
        if (key && key.length > 0) {
          // Import Solana web3 utilities
          const { Keypair } = await import('https://esm.sh/@solana/web3.js@1.91.1');
          
          // Create keypair from the derived seed
          const keypair = Keypair.fromSeed(Uint8Array.from(key.slice(0, 32)));
          
          if (keypair && keypair.publicKey) {
            const address = keypair.publicKey.toString();
            console.log("Successfully regenerated Solana address:", address);
            hdWallets.solana.address = address;
            
            // Store the private key as well
            hdWallets.solana.privateKey = Buffer.from(keypair.secretKey).toString('hex');
          }
        }
      } catch (regenerationError) {
        console.error("Failed to regenerate Solana address:", regenerationError);
      }
    }
    
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
  
  // Solana addresses should be base58 encoded and typically 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  // Check if it's in the right format
  const isValidFormat = base58Regex.test(address);
  
  // Additional check: Solana addresses shouldn't have the pattern appearing in the problematic address
  const hasInvalidParts = /8aCNAc8AQBprr32JoGNA6w2SSS69WbPd/.test(address);
  
  return isValidFormat && !hasInvalidParts;
}
