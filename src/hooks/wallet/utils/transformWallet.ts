
import { WalletData } from '@/utils/walletConfig';

/**
 * Transforms database wallet object to WalletData format
 */
export const transformWallet = (wallet: { 
  id: string; 
  blockchain: string; 
  currency: string;
  address?: string;
}): WalletData => ({
  blockchain: wallet.blockchain,
  platform: wallet.blockchain,
  address: wallet.address || '', // Provide a default empty string if no address
  privateKey: undefined // We don't expose private keys on the frontend
});
