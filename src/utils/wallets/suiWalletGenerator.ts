
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { Buffer } from '../globalPolyfills';
import { WalletData } from '../walletGenerators';

// Generate a Sui wallet
export const generateSuiWallet = (): WalletData => {
  try {
    // Use try/catch to handle any potential issues during Sui wallet creation
    const keypair = new Ed25519Keypair();
    return {
      blockchain: 'Sui',
      platform: 'Sui',
      address: keypair.getPublicKey().toSuiAddress(),
      privateKey: Buffer.from(keypair.export().privateKey, 'base64').toString('hex'),
    };
  } catch (error) {
    console.error('Error generating Sui wallet:', error);
    throw new Error('Failed to generate Sui wallet');
  }
};
