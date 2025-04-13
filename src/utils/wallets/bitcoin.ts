
import { Buffer } from '../globalPolyfills';
import { getBitcoin } from '../bitcoinjsWrapper';
import { getBip32 } from '../bip32Wrapper';
import { getECPairFactory } from '../ecpairWrapper';
import * as ecc from 'tiny-secp256k1';
import { WalletData } from '../types/wallet';
import * as bip39 from 'bip39';
import { DERIVATION_PATHS } from '../constants/derivationPaths';

// Generate a Bitcoin wallet
export const generateBitcoinWallet = async (seedPhrase?: string): Promise<WalletData> => {
  try {
    // Get Bitcoin module
    const bitcoin = await getBitcoin();
    
    // Create key pair from seed phrase or generate new random one
    const ECPair = await getECPairFactory(ecc);
    let keyPair;
    let mnemonicPhrase;
    
    if (seedPhrase) {
      mnemonicPhrase = seedPhrase;
      // Generate seed from mnemonic
      const seed = bip39.mnemonicToSeedSync(seedPhrase);
      
      // Derive key using proper BIP84 path for Native SegWit
      // Get bip32 module (now imported separately)
      const bip32 = await getBip32();
      
      // Derive the node from seed using BIP84 path
      const root = bip32.fromSeed(seed);
      const node = root.derivePath(DERIVATION_PATHS.BITCOIN);
      
      // Get key pair from derived node
      keyPair = ECPair.fromPrivateKey(node.privateKey);
    } else {
      // Generate random key pair
      keyPair = ECPair.makeRandom();
    }
    
    // Generate Native SegWit (P2WPKH) address
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: bitcoin.networks.bitcoin,
    });
    
    if (!address) {
      throw new Error('Failed to generate Bitcoin address');
    }
    
    // Convert private key to hex format
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
