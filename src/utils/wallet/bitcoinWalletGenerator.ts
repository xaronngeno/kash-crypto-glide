
import { getBitcoin } from '../bitcoinjsWrapper';
import { Buffer } from '../globalPolyfills';
import { DERIVATION_PATHS } from './derivationPaths';
import { UnifiedWalletData } from './types';
import { ethers } from 'ethers';

/**
 * Generate a Bitcoin wallet from a mnemonic
 */
export const generateBitcoinWallet = async (mnemonicObj: ethers.Mnemonic): Promise<UnifiedWalletData> => {
  try {
    // Import bitcoinjs-lib dynamically to ensure Buffer is available
    const bitcoin = await getBitcoin();
    
    const bitcoinHdNode = ethers.HDNodeWallet.fromMnemonic(
      mnemonicObj,
      DERIVATION_PATHS.BITCOIN
    );
    
    // Convert to WIF and derive Native SegWit address
    const privateKeyBuffer = Buffer.from(bitcoinHdNode.privateKey.slice(2), 'hex');
    
    // Generate a P2WPKH (Native SegWit) address
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(bitcoinHdNode.publicKey.slice(2), 'hex'),
      network: bitcoin.networks.bitcoin
    });
    
    if (!address) {
      throw new Error("Failed to generate Bitcoin address");
    }
    
    return {
      blockchain: "Bitcoin",
      platform: "Bitcoin",
      address: address,
      privateKey: bitcoinHdNode.privateKey,
      walletType: "Native SegWit"
    };
  } catch (error) {
    console.error("Failed to generate Bitcoin wallet:", error);
    throw error;
  }
}
