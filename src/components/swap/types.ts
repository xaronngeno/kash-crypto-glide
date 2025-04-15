
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

export interface SwapTransaction {
  id: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  spillage?: number;
}

export interface SwapFormValues {
  fromAmount: string;
  toAmount: string;
}

export interface FloatingButtonOption {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  color?: string;
}
