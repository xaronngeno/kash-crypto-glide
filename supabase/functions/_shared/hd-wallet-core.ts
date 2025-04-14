
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { deriveEthereumWallet, deriveSolanaWallet, deriveBitcoinWallet } from "./key-derivation.ts";
import { DERIVATION_PATHS } from "./constants.ts";

/**
 * Generate wallets from seed phrase for all supported blockchains
 * Using standardized derivation paths:
 * SOL: m/44'/501'/0'/0' (ed25519)
 * ETH: m/44'/60'/0'/0/0 (secp256k1)
 * BTC: m/44'/0'/0'/0/0 (secp256k1)
 */
export async function generateHDWallets(seedPhrase: string, userId: string) {
  try {
    console.log("Generating HD wallets from seed phrase");
    
    // Ensure the seed phrase is valid
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      throw new Error("Invalid or empty seed phrase provided");
    }
    
    // Validate seed phrase format
    if (!ethers.Mnemonic.isValidMnemonic(seedPhrase)) {
      throw new Error(`Invalid mnemonic format: ${seedPhrase.substring(0, 5)}...`);
    }
    
    // Derive Ethereum wallet with BIP44 path m/44'/60'/0'/0/0
    const ethereum = deriveEthereumWallet(seedPhrase);
    
    // Derive Solana wallet with BIP44 path m/44'/501'/0'/0'
    let solana;
    try {
      solana = await deriveSolanaWallet(seedPhrase);
    } catch (solError) {
      console.error("Error deriving Solana wallet:", solError);
      throw new Error(`Solana wallet derivation failed: ${solError instanceof Error ? solError.message : String(solError)}`);
    }
    
    // Derive Bitcoin wallet with BIP44 path m/44'/0'/0'/0/0
    const bitcoin = deriveBitcoinWallet(seedPhrase);
    
    // Return all wallets together with the mnemonic
    return {
      ethereum,
      solana,
      bitcoin,
      mnemonic: seedPhrase
    };
  } catch (error) {
    console.error("Error generating HD wallets:", error);
    throw error;
  }
}
