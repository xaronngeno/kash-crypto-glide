
import { ethers } from 'ethers';
import { DERIVATION_PATHS } from '../derivationPaths';
import { UnifiedWalletData } from '../types';

/**
 * Generate a Polygon wallet from a mnemonic
 * Polygon shares the same address format as Ethereum, but with a different derivation path
 */
export const generatePolygonWallet = (mnemonicObj: ethers.Mnemonic): UnifiedWalletData => {
  try {
    // Use HDNodeWallet.fromMnemonic with Polygon path (same as Ethereum)
    const polygonHdNode = ethers.HDNodeWallet.fromMnemonic(
      mnemonicObj,
      DERIVATION_PATHS.ETHEREUM // Polygon uses the same path as Ethereum
    );
    
    return {
      blockchain: "Polygon",
      platform: "Polygon",
      address: polygonHdNode.address,
      privateKey: polygonHdNode.privateKey
    };
  } catch (error) {
    console.error("Failed to generate Polygon wallet:", error);
    throw error;
  }
};

/**
 * Generate a random Polygon wallet (not derived from mnemonic)
 */
export const generateRandomPolygonWallet = (): UnifiedWalletData => {
  try {
    const wallet = ethers.Wallet.createRandom();
    
    return {
      blockchain: "Polygon",
      platform: "Polygon",
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error('Error generating random Polygon wallet:', error);
    throw new Error('Failed to generate random Polygon wallet');
  }
};

/**
 * Verify if an address is a valid Polygon address
 * Polygon addresses follow the same format as Ethereum (0x...)
 */
export const verifyPolygonAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  
  // Ethereum/Polygon addresses are hex strings starting with 0x, 42 chars in total
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
