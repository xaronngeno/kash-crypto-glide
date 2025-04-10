
export interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  amount: number;
  value: number;
  change: number;
  icon: string;
  logo?: string;
  networks?: Record<string, { address: string, balance: number }>;
}
