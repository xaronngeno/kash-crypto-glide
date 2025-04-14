
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

export interface TransactionCommission {
  percentage: number;
  flatFee?: number;
  minCommission?: number;
  maxCommission?: number;
  applicationAddress: string;
}

export interface TransactionWithCommission {
  originalAmount: number;
  commissionAmount: number;
  finalAmount: number;
  recipientAddress: string;
  applicationAddress: string;
}
