
import { Buffer } from '../globalPolyfills';
import { getBitcoin } from '../bitcoinjsWrapper';
import { getECPairFactory } from '../ecpairWrapper';
import * as ecc from 'tiny-secp256k1';
import { WalletData } from '../types/wallet';

// Generate a Bitcoin wallet
export const generateBitcoinWallet = async (): Promise<WalletData> => {
  try {
    // Get Bitcoin module
    const bitcoin = await getBitcoin();
    
    // Create a random key pair
    const ECPair = await getECPairFactory(ecc);
    const keyPair = ECPair.makeRandom();
    
    // Native SegWit (P2WPKH)
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: bitcoin.networks.bitcoin,
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    // Convert private key to WIF format
    const privateKey = keyPair.privateKey?.toString('hex');
    
    return {
      blockchain: 'Bitcoin',
      platform: 'Bitcoin',
      address,
      privateKey: privateKey ? '0x' + privateKey : undefined,
      walletType: 'Native SegWit'
    };
  } catch (error) {
    console.error('Error generating Bitcoin wallet:', error);
    throw new Error('Failed to generate Bitcoin wallet');
  }
};
