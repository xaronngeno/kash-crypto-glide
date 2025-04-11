
import * as ethers from "https://esm.sh/ethers@6.13.5";
import { base58_decode, base58_encode } from "https://esm.sh/bs58@5.0.0/index.js";
import * as solanaWeb3 from "https://esm.sh/@solana/web3.js@1.91.1";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

// Define derivation paths following BIP-44 standards
export const DERIVATION_PATHS = {
  BITCOIN_SEGWIT: "m/84'/0'/0'/0/0", // BIP84 - Native SegWit
  BITCOIN_TAPROOT: "m/86'/0'/0'/0/0", // BIP86 - Taproot
  ETHEREUM: "m/44'/60'/0'/0/0",       // BIP44 - Ethereum
  SOLANA: "m/44'/501'/0'/0'"          // BIP44 - Solana
};

/**
 * Generate HD wallets from a single seed phrase
 */
export function generateHDWallets(userId: string) {
  try {
    console.log("Generating HD wallet from seed phrase...");
    
    // Create a random HD wallet (this automatically generates a mnemonic phrase)
    const hdWallet = ethers.Wallet.createRandom();
    const mnemonic = hdWallet.mnemonic?.phrase;
    
    if (!mnemonic) {
      throw new Error("Failed to generate mnemonic");
    }
    
    console.log("Successfully generated seed phrase");
    
    // Generate Ethereum wallet
    const ethHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.ETHEREUM
    );
    
    // Generate Solana wallet
    const solanaHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.SOLANA
    );
    
    // Extract private key bytes (remove 0x prefix)
    const solPrivateKeyBytes = Buffer.from(solanaHdNode.privateKey.slice(2), 'hex');
    
    // Create Solana keypair using the first 32 bytes
    const solanaKeypair = solanaWeb3.Keypair.fromSeed(solPrivateKeyBytes.slice(0, 32));
    
    // For Bitcoin, we'll use two different derivation paths for SegWit and Taproot
    const btcSegwitHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.BITCOIN_SEGWIT
    );
    
    const btcTaprootHdNode = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      DERIVATION_PATHS.BITCOIN_TAPROOT
    );
    
    // Create a simplified approach for Bitcoin addresses 
    const btcSegwitAddress = `bc1q${btcSegwitHdNode.privateKey.slice(2, 30)}`;
    const btcTaprootAddress = `bc1p${btcTaprootHdNode.privateKey.slice(2, 30)}`;
    
    return {
      mnemonic, 
      ethereum: {
        address: ethHdNode.address,
        privateKey: ethHdNode.privateKey
      },
      solana: {
        address: solanaKeypair.publicKey.toString(),
        privateKey: Buffer.from(solanaKeypair.secretKey).toString('hex')
      },
      bitcoinSegwit: {
        address: btcSegwitAddress,
        privateKey: btcSegwitHdNode.privateKey
      },
      bitcoinTaproot: {
        address: btcTaprootAddress,
        privateKey: btcTaprootHdNode.privateKey
      }
    };
  } catch (error) {
    console.error("Error generating HD wallet:", error);
    throw error;
  }
}
