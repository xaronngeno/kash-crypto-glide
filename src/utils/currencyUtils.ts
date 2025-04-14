
export const getNetworkLogo = (blockchain: string): string => {
  switch (blockchain.toLowerCase()) {
    case 'ethereum':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'solana':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    default:
      return '/placeholder.svg';
  }
};

export const getCurrencyLogo = (symbol: string): string => {
  switch (symbol.toUpperCase()) {
    case 'ETH':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png';
    case 'SOL':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png';
    case 'USDT':
      return 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png';
    default:
      return '/placeholder.svg';
  }
};
