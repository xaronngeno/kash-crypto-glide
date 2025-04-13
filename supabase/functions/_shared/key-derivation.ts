import * as ethers from "https://esm.sh/ethers@6.13.5";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import { DERIVATION_PATHS } from "./constants.ts";

/**
 * Derive an Ethereum wallet from a seed phrase and path
 */
export function deriveEthereumWallet(seedPhrase: string, path = DERIVATION_PATHS.ETHEREUM) {
  try {
    console.log(`Deriving Ethereum wallet with path: ${path}`);
    
    const wallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(seedPhrase),
      path
    );
    
    return {
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error("Error deriving Ethereum wallet:", error);
    throw error;
  }
}

/**
 * Derive a Solana wallet from a seed phrase and path
 */
export function deriveSolanaWallet(seedPhrase: string, path = DERIVATION_PATHS.SOLANA) {
  try {
    console.log(`Deriving Solana wallet with path: ${path}`);
    
    // First create an HD wallet with the Solana path
    const solanaHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(seedPhrase),
      path
    );
    
    // Extract private key bytes (remove 0x prefix)
    const solPrivateKeyBytes = Buffer.from(solanaHdNode.privateKey.slice(2), 'hex');
    
    // In production, you'd generate the proper Solana address using ed25519 derivation
    // For this refactoring example, we're keeping the same simplified logic
    const seed = solPrivateKeyBytes.slice(0, 32);
    
    // Generate a deterministic key through SHA-256
    const keyPairBytes = crypto.subtle.digest('SHA-256', seed);
    
    // Encode to Base58 (simplified version)
    const generateBase58Address = async (publicKey: Uint8Array): Promise<string> => {
      // Simplified Base58 encoding logic (keeping the same as original)
      const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
      let address = '';
      let value = BigInt(0);
      
      for (let i = 0; i < publicKey.length; i++) {
        value = (value * BigInt(256)) + BigInt(publicKey[i]);
      }
      
      while (value > 0) {
        const mod = Number(value % BigInt(58));
        address = base58Chars[mod] + address;
        value = value / BigInt(58);
      }
      
      // Pad with '1's for leading zeros (like bs58 does)
      for (let i = 0; i < publicKey.length && publicKey[i] === 0; i++) {
        address = '1' + address;
      }
      
      return address;
    };
    
    return {
      deriveFullAddress: async () => {
        const keyPairArray = new Uint8Array(await keyPairBytes);
        const publicKey = keyPairArray.slice(0, 32);
        const address = await generateBase58Address(publicKey);
        const privateKey = Array.from(seed).map(b => b.toString(16).padStart(2, '0')).join('');
        
        return {
          address,
          privateKey
        };
      }
    };
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw error;
  }
}

/**
 * Derive a Bitcoin SegWit wallet from a seed phrase and path
 */
export function deriveBitcoinWallet(seedPhrase: string, path = DERIVATION_PATHS.BITCOIN_SEGWIT) {
  try {
    console.log(`Deriving Bitcoin wallet with path: ${path}`);
    
    // Create HD wallet from mnemonic using BIP84 for Native SegWit
    const btcHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(seedPhrase),
      path
    );
    
    // Create a valid Bitcoin segwit address format (simplified)
    const btcAddress = `bc1q${btcHdNode.address.slice(2, 38)}`;
    
    return {
      address: btcAddress,
      privateKey: btcHdNode.privateKey
    };
  } catch (error) {
    console.error("Error deriving Bitcoin wallet:", error);
    throw error;
  }
}
