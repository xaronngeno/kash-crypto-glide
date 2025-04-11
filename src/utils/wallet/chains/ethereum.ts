
import { ethers } from 'ethers';
import { DERIVATION_PATHS } from '../derivationPaths';
import { UnifiedWalletData } from '../types';

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
 * Generate a random Ethereum wallet (not derived from mnemonic)
 */
export const generateRandomEthereumWallet = (): UnifiedWalletData => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      blockchain: "Ethereum",
      platform: "Ethereum",
      address: wallet.address,
      privateKey: wallet.privateKey
    };
  } catch (error) {
    console.error("Error generating random Ethereum wallet:", error);
    throw new Error("Failed to generate random Ethereum wallet");
  }
};
