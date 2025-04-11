
import { ethers } from 'ethers';
import { WalletData } from '../walletGenerators';

// Generate an Ethereum wallet or Ethereum-compatible wallet
export const generateEthWallet = (blockchain: string, platform: string): WalletData => {
  try {
    const wallet = ethers.Wallet.createRandom();
    return {
      blockchain,
      platform,
      address: wallet.address,
      privateKey: wallet.privateKey,
    };
  } catch (error) {
    console.error(`Error generating ${blockchain} wallet:`, error);
    throw new Error(`Failed to generate ${blockchain} wallet`);
  }
};
