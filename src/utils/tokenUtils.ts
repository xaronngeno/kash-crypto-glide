
/**
 * Utility functions related to cryptocurrency tokens
 */

export interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  networks?: string[];
  balance?: number;
  value?: number;
  logo?: string;
}

export const getCurrencyLogo = (symbol: string): string => {
  switch (symbol.toUpperCase()) {
    case 'BTC':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
    case 'ETH':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'SOL':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'TRX':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1958.png';
    case 'USDT':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png';
    case 'BNB':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png';
    case 'MATIC':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png';
    default:
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png';
  }
};

export const getNetworksForCurrency = (symbol: string): string[] => {
  switch(symbol.toUpperCase()) {
    case 'BTC':
      return ['Bitcoin'];
    case 'ETH':
      return ['Ethereum'];
    case 'USDT':
      return ['Ethereum', 'Tron', 'Binance Smart Chain', 'Solana', 'Polygon'];
    case 'SOL':
      return ['Solana'];
    case 'TRX':
      return ['Tron'];
    case 'BNB':
      return ['Binance Smart Chain'];
    case 'MATIC':
      return ['Polygon'];
    default:
      return ['Ethereum'];
  }
};

export const calculateFee = (symbol: string, network: string): number => {
  const feeMap: Record<string, Record<string, number>> = {
    BTC: { Bitcoin: 0.0001 },
    ETH: { Ethereum: 0.002 },
    USDT: { 
      Ethereum: 5,
      'Tron': 1,
      'Binance Smart Chain': 0.5
    },
    SOL: { Solana: 0.01 },
    BNB: { 'Binance Smart Chain': 0.0005 },
    MATIC: { Polygon: 0.01 }
  };
  
  return feeMap[symbol]?.[network] || 0.001;
};
