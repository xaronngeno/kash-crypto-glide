
/**
 * Interface for wallet data
 */
export interface UnifiedWalletData {
  blockchain: string;
  platform: string;
  address: string;
  privateKey?: string;
  walletType?: string;
}
