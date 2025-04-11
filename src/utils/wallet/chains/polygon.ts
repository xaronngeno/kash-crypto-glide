
import { DERIVATION_PATHS } from '../derivationPaths';
import { UnifiedWalletData } from '../types';

/**
 * Generate a Polygon wallet from the same mnemonic as Ethereum
 * Polygon shares the same address format as Ethereum
 */
export const generatePolygonWallet = (ethWallet: UnifiedWalletData): UnifiedWalletData => {
  return {
    blockchain: "Polygon",
    platform: "Polygon",
    address: ethWallet.address,
    privateKey: ethWallet.privateKey
  };
};

/**
 * Generate a random Polygon wallet (not derived from mnemonic)
 * This uses the Ethereum wallet generator since they use the same format
 */
export const generateRandomPolygonWallet = (ethWallet: UnifiedWalletData): UnifiedWalletData => {
  return {
    blockchain: "Polygon",
    platform: "Polygon",
    address: ethWallet.address,
    privateKey: ethWallet.privateKey
  };
};
