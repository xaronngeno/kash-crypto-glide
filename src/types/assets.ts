
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
  address?: string;
  blockchain?: string;
  platform?: {
    name: string;
    logo: string;
  };
  networks?: Record<string, { address: string, balance: number }>;
  walletType?: string;         // 'native', 'token', 'imported', etc.
  contractAddress?: string;    // For ERC-20 and SPL tokens
  decimals?: number;           // Token decimals
  tokenStandard?: string;      // 'ERC20', 'SPL', etc.
}
