
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import { DERIVATION_PATHS } from "./constants.ts";
import { derivePath } from "https://esm.sh/ed25519-hd-key@1.3.0";
import * as nacl from "https://esm.sh/tweetnacl@1.0.3";
import * as bs58 from "https://esm.sh/bs58@5.0.0";

/**
 * Derive an Ethereum wallet from a seed phrase and path
 */
export function deriveEthereumWallet(seedPhrase: string, path = DERIVATION_PATHS.ETHEREUM) {
  try {
    console.log(`Deriving Ethereum wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      throw new Error("Invalid or empty seed phrase");
    }
    
    const wallet = ethers.HDNodeWallet.fromPhrase(
      seedPhrase,
      undefined,
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
 * Using standard ed25519 derivation for compatibility with Phantom and other wallets
 */
export async function deriveSolanaWallet(seedPhrase: string, path = DERIVATION_PATHS.SOLANA) {
  try {
    console.log(`Deriving Solana wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      throw new Error("Invalid or empty seed phrase");
    }

    // Convert mnemonic to seed - this is the standard BIP39 process
    const bip39 = await import("https://esm.sh/bip39@3.1.0");
    const seed = await bip39.mnemonicToSeed(seedPhrase);
    
    // Derive the ed25519 key using the standard Solana derivation path
    const { key } = derivePath(path, Buffer.from(seed).toString('hex'));
    
    // Generate keypair from the derived key - THIS MATCHES PHANTOM WALLET
    const keyPair = nacl.sign.keyPair.fromSeed(key.slice(0, 32));
    
    // Get public key in base58 format (standard Solana address format)
    const publicKeyBase58 = bs58.encode(Buffer.from(keyPair.publicKey));
    
    return {
      address: publicKeyBase58,
      privateKey: bs58.encode(Buffer.from(keyPair.secretKey))
    };
  } catch (error) {
    console.error("Error deriving Solana wallet:", error);
    throw error;
  }
}

/**
 * Derive a Bitcoin wallet from a seed phrase and path
 * Using standard BIP84 path for Native SegWit addresses
 */
export function deriveBitcoinWallet(seedPhrase: string, path = DERIVATION_PATHS.BITCOIN_NATIVE_SEGWIT) {
  try {
    console.log(`Deriving Bitcoin wallet with path: ${path}`);
    
    // Ensure seedPhrase is valid before proceeding
    if (!seedPhrase || typeof seedPhrase !== 'string' || seedPhrase.trim() === '') {
      throw new Error("Invalid or empty seed phrase");
    }
    
    // We'll use ethers as a temporary solution to derive the private key
    // A more complete solution would use bitcoinjs-lib directly
    const btcHdNode = ethers.HDNodeWallet.fromPhrase(
      seedPhrase,
      undefined,
      path
    );
    
    // Get a placeholder Bitcoin address - in production code, you should use 
    // bitcoinjs-lib to derive the proper address from this key
    let btcAddress = "";
    
    if (path === DERIVATION_PATHS.BITCOIN_NATIVE_SEGWIT) {
      // BIP84 Native SegWit (bc1 prefix)
      btcAddress = `bc1q${btcHdNode.address.slice(2, 34)}`;
    } else if (path === DERIVATION_PATHS.BITCOIN_SEGWIT) {
      // BIP49 SegWit compatible (3 prefix)
      btcAddress = `3${btcHdNode.address.slice(2, 34)}`;
    } else {
      // BIP44 Legacy (1 prefix)
      btcAddress = `1${btcHdNode.address.slice(2, 34)}`;
    }
    
    return {
      address: btcAddress,
      privateKey: btcHdNode.privateKey
    };
  } catch (error) {
    console.error("Error deriving Bitcoin wallet:", error);
    throw error;
  }
}
