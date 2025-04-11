
import { ethers } from 'ethers';
import { DERIVATION_PATHS } from './derivationPaths';
import { UnifiedWalletData } from './types';
import { Buffer } from '../globalPolyfills';

/**
 * Generate an Ethereum wallet from a mnemonic
 */
export const generateEthereumWallet = (mnemonicObj: ethers.Mnemonic): UnifiedWalletData => {
  const ethHdNode = ethers.HDNodeWallet.fromMnemonic(
    mnemonicObj,
    DERIVATION_PATHS.ETHEREUM
  );
  
  return {
    blockchain: "Ethereum",
    platform: "Ethereum",
    address: ethHdNode.address,
    privateKey: ethHdNode.privateKey
  };
};

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
