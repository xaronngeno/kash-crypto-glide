
import { Keypair } from '@solana/web3.js';
import { Buffer } from '../globalPolyfills';
import { DERIVATION_PATHS } from './derivationPaths';
import { UnifiedWalletData } from './types';
import { ethers } from 'ethers';

/**
 * Generate a Solana wallet from a mnemonic
 */
export const generateSolanaWallet = (mnemonicObj: ethers.Mnemonic): UnifiedWalletData => {
  try {
    // Use HDNodeWallet.fromMnemonic with the Solana path
    const solanaSeedNode = ethers.HDNodeWallet.fromMnemonic(
      mnemonicObj,
      DERIVATION_PATHS.SOLANA
    );
    
    // Extract private key bytes (remove 0x prefix)
    const privateKeyBytes = Buffer.from(solanaSeedNode.privateKey.slice(2), 'hex');
    
    // Create Solana keypair using the first 32 bytes of the private key bytes
    // This matches how Phantom and other Solana wallets derive their keypair
    const keypair = Keypair.fromSeed(privateKeyBytes.slice(0, 32));
    
    return {
      blockchain: "Solana",
      platform: "Solana",
      address: keypair.publicKey.toBase58(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex')
    };
  } catch (error) {
    console.error("Failed to generate Solana wallet:", error);
    throw error;
  }
}
