
export interface WalletAddress {
  blockchain: string;
  symbol: string;
  address: string;
  logo?: string;
  balance?: number;  // Add balance field to the type
}
