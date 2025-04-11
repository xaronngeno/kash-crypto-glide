
import { ethers } from 'ethers';
import { DERIVATION_PATHS } from './derivationPaths';
import { UnifiedWalletData } from './types';

/**
 * Generate a Tron wallet from a mnemonic
 */
export const generateTronWallet = (mnemonicObj: ethers.Mnemonic): UnifiedWalletData => {
  try {
    // Use HDNodeWallet.fromMnemonic with the Tron path
    const tronHdNode = ethers.HDNodeWallet.fromMnemonic(
      mnemonicObj,
      DERIVATION_PATHS.TRON
    );
    
    // Derive Tron address using their address format
    // Tron addresses start with 'T' followed by a base58 encoded hash
    // For this implementation we'll create a compatible address format
    
    // Extract the private key (remove 0x prefix)
    // Get the Ethereum-format address
    const ethAddress = tronHdNode.address;
    
    // Convert Ethereum address to Tron format (simplified)
    // In real implementation, use TronWeb's fromHex function
    const tronAddress = "T" + ethAddress.slice(3, 37);
    
    return {
      blockchain: "Tron",
      platform: "Tron",
      address: tronAddress,
      privateKey: tronHdNode.privateKey
    };
  } catch (error) {
    console.error("Failed to generate Tron wallet:", error);
    throw error;
  }
}
