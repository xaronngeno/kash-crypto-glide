
import { WalletData } from '@/utils/types/wallet';

/**
 * Transform wallet data from database format to WalletData type
 */
export const transformWallet = (wallet: any): WalletData => {
  return {
    blockchain: wallet.blockchain || '',
    platform: wallet.blockchain || '',
    address: wallet.address || '',
    privateKey: wallet.privateKey || undefined,
    walletType: wallet.wallet_type
  };
};
