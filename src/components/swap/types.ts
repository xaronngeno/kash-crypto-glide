
export interface AssetInfo {
  symbol: string;
  name: string;
  logo: string;
  price: number;
}

export interface TransactionResult {
  amount: number; 
  type: 'buy' | 'sell';
}

export interface RateInfo {
  usdtToKesRate: number;
  kesExchangeRate: number;
  maxUsdtLimit: number;
  minKesAmount: number;
}
