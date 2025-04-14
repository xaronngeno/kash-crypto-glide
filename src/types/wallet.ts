
export interface WalletAddress {
  blockchain: string;
  symbol: string;
  address: string;
  wallet_type?: string;
  logo?: string;
}

export interface WalletResponse {
  blockchain: string;
  currency: string;
  address: string;
  balance?: number;
  logo?: string;
}
