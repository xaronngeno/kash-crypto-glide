
import { ethers } from 'ethers';
import { WalletData } from '../types/wallet';

// Generate an Ethereum wallet
export const generateEthWallet = (blockchain = 'Ethereum', platform = 'Ethereum'): WalletData => {
  try {
    // Create a random Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    const address = wallet.address;
    const privateKey = wallet.privateKey;
    
    return {
      blockchain,
      platform,
      address,
      privateKey
    };
  } catch (error) {
    console.error('Error generating ETH wallet:', error);
    throw new Error(`Failed to generate ${blockchain} wallet`);
  }
};

// Generate a Tron wallet
export const generateTronWallet = (): WalletData => {
  try {
    // Create a random Ethereum wallet
    const wallet = ethers.Wallet.createRandom();
    const ethAddress = wallet.address;
    const privateKey = wallet.privateKey;
    
    // Convert Ethereum address to Tron format (simplified approach)
    // Real implementation should use TronWeb library
    const tronAddress = 'T' + ethAddress.slice(3);
    
    return {
      blockchain: 'Tron',
      platform: 'Tron',
      address: tronAddress,
      privateKey
    };
  } catch (error) {
    console.error('Error generating Tron wallet:', error);
    throw new Error('Failed to generate Tron wallet');
  }
};
