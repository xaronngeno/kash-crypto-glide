
import { Keypair } from '@solana/web3.js';
import { Buffer } from '../globalPolyfills';
import { WalletData } from '../walletGenerators';

// Generate a Solana wallet
export const generateSolanaWallet = (): WalletData => {
  try {
    const keypair = Keypair.generate();
    return {
      blockchain: 'Solana',
      platform: 'Solana',
      address: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
    };
  } catch (error) {
    console.error('Error generating Solana wallet:', error);
    throw new Error('Failed to generate Solana wallet');
  }
};
