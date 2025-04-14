
export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  logo?: string;
  networks?: string[];
  commissionEnabled?: boolean;
  commissionPercentage?: number;
}
